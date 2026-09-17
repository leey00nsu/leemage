import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  type ImageJob,
  type StorageProvider,
} from "@/lib/generated/prisma";
import { StorageFactory, fromPrismaStorageProvider } from "@/lib/storage";
import {
  getReservedStorageBytes,
  invalidateAllStorageCaches,
  lockStorageQuota,
} from "@/lib/api/storage-quota";
import { validateMagicBytes } from "@/lib/validation/file-validator";
import { planImageTransforms } from "@/shared/lib/image-transform-plan";
import type {
  ImageVariantData,
  VariantOption,
} from "@/lib/api/confirm/types";
import { enqueueStorageObjects } from "@/lib/storage/cleanup-queue";
import { workerLogger } from "@/lib/logging/secure-logger";

const MAX_ATTEMPTS = 3;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_VARIANT_BYTES = 25 * 1024 * 1024;

class PermanentImageError extends Error {}

export async function claimImageJob(): Promise<ImageJob | null> {
  return prisma.$transaction(async (tx) => {
    const expired = await tx.imageJob.findMany({
      where: {
        status: "RUNNING",
        attempts: { gte: MAX_ATTEMPTS },
        leaseUntil: { lt: new Date() },
      },
      select: { id: true, leaseToken: true },
    });
    for (const job of expired) {
      const updated = await tx.imageJob.updateMany({
        where: {
          id: job.id,
          status: "RUNNING",
          leaseToken: job.leaseToken,
          leaseUntil: { lt: new Date() },
        },
        data: {
          status: "FAILED",
          leaseUntil: null,
          leaseToken: null,
          lastError: "WORKER_LEASE_EXPIRED",
        },
      });
      if (updated.count) {
        await tx.file.updateMany({
          where: { id: job.id },
          data: { processingStatus: "FAILED" },
        });
      }
    }

    const jobs = await tx.$queryRaw<ImageJob[]>`
      WITH candidate AS (
        SELECT id FROM "ImageJob"
        WHERE attempts < ${MAX_ATTEMPTS} AND
          ((status = 'QUEUED' AND "availableAt" <= NOW()) OR (status = 'RUNNING' AND "leaseUntil" < NOW()))
        ORDER BY "availableAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE "ImageJob" j SET status = 'RUNNING', attempts = j.attempts + 1,
        "leaseToken" = ${randomUUID()}, "leaseUntil" = NOW() + INTERVAL '2 minutes', "updatedAt" = NOW()
      FROM candidate c WHERE j.id = c.id RETURNING j.*
    `;
    const job = jobs[0];
    if (job) {
      await tx.file.update({
        where: { id: job.id },
        data: { processingStatus: "RUNNING" },
      });
    }
    return job ?? null;
  });
}

export async function executeImageJob(job: ImageJob): Promise<void> {
  const ownership = {
    id: job.id,
    status: "RUNNING",
    leaseToken: job.leaseToken,
  };
  const uploadedObjects: string[] = [];
  let adapter: Awaited<ReturnType<typeof StorageFactory.getAdapter>> | null =
    null;
  let sourceObjectName: string | null = null;
  let cleanupProvider: StorageProvider | null = null;
  let permanentFailure = false;
  const heartbeat = setInterval(() => {
    void prisma.imageJob
      .updateMany({
        where: ownership,
        data: { leaseUntil: new Date(Date.now() + 120_000) },
      })
      .catch(() => {});
  }, 30_000);

  try {
    const file = await prisma.file.findUnique({
      where: { id: job.id },
      include: { project: true },
    });
    if (!file?.objectName || !file.url) return;
    sourceObjectName = file.objectName;
    cleanupProvider = file.project.storageProvider;
    adapter = await StorageFactory.getAdapter(
      fromPrismaStorageProvider(file.project.storageProvider),
    );
    const original = await adapter.downloadObject(file.objectName);
    if (original.length > MAX_IMAGE_BYTES) {
      throw new PermanentImageError("IMAGE_TOO_LARGE");
    }
    if (!validateMagicBytes(original, file.mimeType)) {
      throw new PermanentImageError("IMAGE_CONTENT_MISMATCH");
    }

    let metadata;
    try {
      metadata = await sharp(original, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: "error",
      }).metadata();
    } catch {
      throw new PermanentImageError("IMAGE_DECODE_FAILED");
    }
    const width = metadata.autoOrient?.width ?? metadata.width ?? 0;
    const height = metadata.autoOrient?.height ?? metadata.height ?? 0;
    if (!width || !height || width * height > MAX_IMAGE_PIXELS) {
      throw new PermanentImageError("IMAGE_PIXEL_LIMIT_EXCEEDED");
    }

    const requested = job.variants as unknown as VariantOption[];
    let plans;
    try {
      plans = planImageTransforms(
        width,
        height,
        file.mimeType.split("/")[1] || "jpeg",
        requested,
      );
    } catch {
      throw new PermanentImageError("INVALID_IMAGE_TRANSFORM");
    }

    const processed: ImageVariantData[] = [];
    for (const plan of plans) {
      const pipeline = sharp(original, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: "error",
      })
        .rotate()
        .resize({
          width: plan.width,
          height: plan.height,
          fit: plan.fit === "cover" ? "cover" : "fill",
          withoutEnlargement: true,
        });
      const { data, info } = await pipeline
        .toFormat(
          plan.format,
          plan.format === "png"
            ? {}
            : { quality: plan.format === "avif" ? 50 : 80 },
        )
        .toBuffer({ resolveWithObject: true });
      if (data.length > MAX_VARIANT_BYTES) {
        throw new PermanentImageError("IMAGE_VARIANT_TOO_LARGE");
      }
      const outputName = plan.thumbnail
        ? `${file.projectId}/${file.id}-thumbnail-${job.leaseToken}.webp`
        : `${file.projectId}/${file.id}-${plan.key}-${job.leaseToken}.${plan.format}`;
      const url = await adapter.uploadObject(
        outputName,
        data,
        `image/${plan.format}`,
      );
      uploadedObjects.push(outputName);
      processed.push({
        url,
        width: info.width,
        height: info.height,
        size: data.length,
        format: plan.format,
        label: plan.thumbnail ? "thumbnail" : `${info.width}x${info.height}`,
      });
    }

    const source: ImageVariantData = {
      url: file.url,
      width,
      height,
      size: file.size,
      format: file.mimeType.split("/")[1] || "jpeg",
      label: `${width}x${height}`,
    };
    const variants = [source, ...processed];
    const extraBytes = processed.reduce((total, item) => total + item.size, 0);

    const published = await prisma.$transaction(async (tx) => {
      const owned = await tx.imageJob.findFirst({ where: ownership });
      if (!owned) return false;
      await lockStorageQuota(tx, file.project.storageProvider);
      const quota = await tx.storageQuota.findUnique({
        where: { provider: file.project.storageProvider },
      });
      const quotaBytes = Number(quota?.quotaBytes ?? 0);
      const used =
        quotaBytes > 0
          ? await getReservedStorageBytes(tx, file.project.storageProvider)
          : 0;
      if (quotaBytes > 0 && used + extraBytes > quotaBytes) {
        await tx.imageJob.updateMany({
          where: ownership,
          data: {
            status: "FAILED",
            leaseUntil: null,
            leaseToken: null,
            lastError: "STORAGE_QUOTA_EXCEEDED",
          },
        });
        await tx.file.update({
          where: { id: file.id },
          data: { processingStatus: "FAILED" },
        });
        return false;
      }
      const updated = await tx.imageJob.updateMany({
        where: ownership,
        data: {
          status: "DONE",
          leaseUntil: null,
          leaseToken: null,
          lastError: null,
        },
      });
      if (!updated.count) return false;
      await tx.file.update({
        where: { id: file.id },
        data: {
          status: "COMPLETED",
          processingStatus: "READY",
          variants: variants as Prisma.JsonArray,
        },
      });
      return true;
    });
    if (published) {
      uploadedObjects.length = 0;
      invalidateAllStorageCaches();
    }
  } catch (error) {
    permanentFailure = error instanceof PermanentImageError;
    await prisma.$transaction(async (tx) => {
      const terminal = permanentFailure || job.attempts >= MAX_ATTEMPTS;
      const status = terminal ? "FAILED" : "QUEUED";
      const updated = await tx.imageJob.updateMany({
        where: ownership,
        data: {
          status,
          availableAt: new Date(Date.now() + 5000 * 2 ** (job.attempts - 1)),
          leaseToken: null,
          leaseUntil: null,
          lastError: permanentFailure
            ? (error as Error).message
            : "IMAGE_PROCESSING_FAILED",
        },
      });
      if (updated.count) {
        await tx.file.updateMany({
          where: { id: job.id },
          data: {
            processingStatus: status,
            ...(permanentFailure && { status: "FAILED" }),
          },
        });
      }
    });
  } finally {
    clearInterval(heartbeat);
    if (adapter) {
      const cleanupObjects = [...uploadedObjects];
      if (permanentFailure && sourceObjectName) {
        cleanupObjects.push(sourceObjectName);
      }
      const results = await Promise.allSettled(
        cleanupObjects.map((objectName) => adapter!.deleteObject(objectName)),
      );
      const failed = cleanupObjects.filter(
        (_, index) => results[index]?.status === "rejected",
      );
      if (cleanupProvider && failed.length > 0) {
        await enqueueStorageObjects(cleanupProvider, failed).catch(() => {
          workerLogger.error("image.cleanup-queue.failed", { jobId: job.id });
        });
      }
    }
  }
}
