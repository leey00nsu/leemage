import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  type StorageProvider,
  type VideoJob,
} from "@/lib/generated/prisma";
import { StorageFactory, fromPrismaStorageProvider } from "@/lib/storage";
import {
  getReservedStorageBytes,
  invalidateAllStorageCaches,
  lockStorageQuota,
} from "@/lib/api/storage-quota";
import { processRemoteVideo } from "./remote";
import { enqueueStorageObjects } from "@/lib/storage/cleanup-queue";
import { workerLogger } from "@/lib/logging/secure-logger";

const MAX_ATTEMPTS = 3;

export async function claimVideoJob(): Promise<VideoJob | null> {
  return prisma.$transaction(async (tx) => {
    // An exhausted job whose worker crashed must also become terminal.
    const expired = await tx.videoJob.findMany({
      where: {
        status: "RUNNING",
        attempts: { gte: MAX_ATTEMPTS },
        leaseUntil: { lt: new Date() },
      },
      select: { id: true, leaseToken: true },
    });
    for (const job of expired) {
      const updated = await tx.videoJob.updateMany({
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
      if (updated.count)
        await tx.file.updateMany({
          where: { id: job.id },
          data: { processingStatus: "FAILED" },
        });
    }
    const jobs = await tx.$queryRaw<VideoJob[]>`
      WITH candidate AS (
        SELECT id FROM "VideoJob"
        WHERE attempts < ${MAX_ATTEMPTS} AND
          ((status = 'QUEUED' AND "availableAt" <= NOW()) OR (status = 'RUNNING' AND "leaseUntil" < NOW()))
        ORDER BY "availableAt" ASC FOR UPDATE SKIP LOCKED LIMIT 1
      )
      UPDATE "VideoJob" j SET status = 'RUNNING', attempts = j.attempts + 1,
        "leaseToken" = ${randomUUID()}, "leaseUntil" = NOW() + INTERVAL '2 minutes', "updatedAt" = NOW()
      FROM candidate c WHERE j.id = c.id RETURNING j.*
    `;
    const job = jobs[0];
    if (job)
      await tx.file.update({
        where: { id: job.id },
        data: { processingStatus: "RUNNING" },
      });
    return job ?? null;
  });
}

export async function executeVideoJob(job: VideoJob): Promise<void> {
  let cleanup: (() => Promise<void>) | undefined;
  let cleanupObject: string | undefined;
  let cleanupProvider: StorageProvider | undefined;
  let release: (() => Promise<void>) | undefined;
  const ownership = {
    id: job.id,
    status: "RUNNING",
    leaseToken: job.leaseToken,
  };
  const heartbeat = setInterval(() => {
    void prisma.videoJob
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
    if (!file) return;
    if (!file.project.videoThumbnailEnabled) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.videoJob.updateMany({
          where: ownership,
          data: { status: "DONE", leaseToken: null, leaseUntil: null },
        });
        if (updated.count)
          await tx.file.update({
            where: { id: file.id },
            data: { processingStatus: "SKIPPED" },
          });
      });
      return;
    }
    const adapter = await StorageFactory.getAdapter(
      fromPrismaStorageProvider(file.project.storageProvider),
    );
    if (!file.objectName) throw new Error("VIDEO_OBJECT_MISSING");
    const access = await adapter.createReadAccess(file.objectName);
    release = access.release;
    const result = await processRemoteVideo(access.url);
    const metadata = await sharp(result.thumbnail).metadata();
    const thumbnailObject = `${file.projectId}/${file.id}-thumbnail-${job.leaseToken}.jpg`;
    // Fence output objects too: an expired worker must never overwrite a newer result.
    cleanup = () => adapter.deleteObject(thumbnailObject);
    cleanupObject = thumbnailObject;
    cleanupProvider = file.project.storageProvider;
    const thumbnailUrl = await adapter.uploadObject(
      thumbnailObject,
      result.thumbnail,
      "image/jpeg",
    );
    const variants = [
      {
        url: file.url,
        width: result.width,
        height: result.height,
        size: file.size,
        format: file.mimeType.split("/")[1],
        label: `${result.width}x${result.height}`,
      },
      {
        url: thumbnailUrl,
        width: metadata.width!,
        height: metadata.height!,
        size: result.thumbnail.length,
        format: "jpeg",
        label: "thumbnail",
      },
    ];
    const saved = await prisma.$transaction(async (tx) => {
      const owned = await tx.videoJob.findFirst({ where: ownership });
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
      if (quotaBytes > 0 && used + result.thumbnail.length > quotaBytes) {
        const failed = await tx.videoJob.updateMany({
          where: ownership,
          data: {
            status: "FAILED",
            leaseUntil: null,
            leaseToken: null,
            lastError: "STORAGE_QUOTA_EXCEEDED",
          },
        });
        if (failed.count)
          await tx.file.update({
            where: { id: file.id },
            data: { processingStatus: "FAILED" },
          });
        return false;
      }
      const updated = await tx.videoJob.updateMany({
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
          processingStatus: "READY",
          variants: variants as Prisma.JsonArray,
        },
      });
      return true;
    });
    if (saved) {
      cleanup = undefined;
      invalidateAllStorageCaches();
    }
  } catch {
    await prisma.$transaction(async (tx) => {
      const status = job.attempts >= MAX_ATTEMPTS ? "FAILED" : "QUEUED";
      const updated = await tx.videoJob.updateMany({
        where: ownership,
        data: {
          status,
          availableAt: new Date(Date.now() + 5000 * 2 ** (job.attempts - 1)),
          leaseToken: null,
          leaseUntil: null,
          lastError: "VIDEO_PROCESSING_FAILED",
        },
      });
      if (updated.count)
        await tx.file.updateMany({
          where: { id: job.id },
          data: { processingStatus: status },
        });
    });
  } finally {
    clearInterval(heartbeat);
    await cleanup?.().catch(() => {
      workerLogger.warn("video.output-cleanup.failed", { jobId: job.id });
      if (cleanupObject && cleanupProvider) {
        void enqueueStorageObjects(cleanupProvider, [cleanupObject]).catch(() => {
          workerLogger.error("video.cleanup-queue.failed", { jobId: job.id });
        });
      }
    });
    await release?.().catch(() => {
      workerLogger.warn("video.read-access-cleanup.failed", { jobId: job.id });
    });
  }
}
