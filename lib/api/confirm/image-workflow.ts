import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";
import { NextResponse } from "next/server";
import sharp from "sharp";
import type { Metadata } from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";
import { validateMagicBytes } from "@/lib/validation/file-validator";
import {
  type ImageVariantData,
  type VariantOption,
} from "@/lib/api/confirm/types";

import { planImageTransforms } from "@/shared/lib/image-transform-plan";

interface HandleImageConfirmInput {
  projectId: string;
  fileId: string;
  objectName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  variants: VariantOption[];
  storageAdapter: StorageAdapter;
}

export async function handleImageConfirm({
  projectId,
  fileId,
  objectName,
  fileName,
  contentType,
  fileSize,
  variants,
  storageAdapter,
}: HandleImageConfirmInput): Promise<NextResponse> {
  const objectUrl = storageAdapter.getObjectUrl(objectName);

  const originalBuffer = await storageAdapter.downloadObject(objectName);

  if (!validateMagicBytes(originalBuffer, contentType)) {
    await prisma.file.delete({ where: { id: fileId } });
    await storageAdapter.deleteObject(objectName).catch(() => {});

    return NextResponse.json(
      { message: "File content does not match the declared content type." },
      { status: 400 },
    );
  }

  let originalMetadata: Metadata;
  try {
    originalMetadata = await sharp(originalBuffer).metadata();
  } catch (error) {
    // Preserve source-only uploads for formats not supported by this Sharp build.
    if (variants.length > 0) throw error;
    const savedFile = await prisma.file.update({
      where: { id: fileId },
      data: {
        name: fileName,
        mimeType: contentType,
        isImage: true,
        size: fileSize,
        url: objectUrl,
        objectName,
        status: "COMPLETED",
        uploadedAt: new Date(),
        variants: [],
      },
    });
    invalidateAllStorageCaches();
    const response = NextResponse.json(
      {
        message: "Image uploaded; preview unavailable for this format",
        file: { ...savedFile, thumbnail: null },
        variants: [],
      },
      { status: 201 },
    );
    attachResponseLogMetadata(response, {
      fileName,
      fileSize,
      contentType,
      fileType: "image",
    });
    return response;
  }
  const originalFormat = contentType.split("/")[1] || "jpeg";

  const orientedWidth =
    originalMetadata.autoOrient?.width ?? originalMetadata.width ?? 0;
  const orientedHeight =
    originalMetadata.autoOrient?.height ?? originalMetadata.height ?? 0;
  let plans;
  try {
    plans = planImageTransforms(
      orientedWidth,
      orientedHeight,
      originalFormat,
      variants,
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Invalid image transform",
      },
      { status: 400 },
    );
  }
  const processedVariants: ImageVariantData[] = [];
  // Bounded sequential processing avoids spikes from large combination requests.
  for (const plan of plans) {
    const pipeline = sharp(originalBuffer)
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
    const outputName = plan.thumbnail
      ? `${projectId}/${fileId}-thumbnail.webp`
      : `${projectId}/${fileId}-${plan.key}.${plan.format}`;
    const url = await storageAdapter.uploadObject(
      outputName,
      data,
      `image/${plan.format}`,
    );
    processedVariants.push({
      url,
      width: info.width,
      height: info.height,
      size: data.length,
      format: plan.format,
      label: plan.thumbnail ? "thumbnail" : `${info.width}x${info.height}`,
    });
  }
  const thumbnail =
    processedVariants.find((v) => v.label === "thumbnail") ?? null;

  const sourceLabel = `${originalMetadata.width || 0}x${originalMetadata.height || 0}`;
  const allVariants: ImageVariantData[] = [
    {
      url: objectUrl,
      width: originalMetadata.width || 0,
      height: originalMetadata.height || 0,
      size: fileSize,
      format: originalFormat,
      label: sourceLabel,
    },
    ...processedVariants,
  ];

  const savedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      name: fileName,
      mimeType: contentType,
      isImage: true,
      size: fileSize,
      url: objectUrl,
      objectName,
      status: "COMPLETED",
      uploadedAt: new Date(),
      variants: allVariants as Prisma.JsonArray,
    },
  });

  invalidateAllStorageCaches();
  const response = NextResponse.json(
    {
      message: "Image upload and processing complete",
      file: { ...savedFile, thumbnail },
      variants: allVariants,
    },
    { status: 201 },
  );

  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "image",
    variantCount: allVariants.length,
    thumbnailUrl: thumbnail?.url,
  });

  return response;
}
