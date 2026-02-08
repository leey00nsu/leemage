import { NextResponse } from "next/server";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";
import {
  generateThumbnailFromBuffer,
  getVideoMetadataFromBuffer,
  type VideoMetadata,
} from "@/lib/video/thumbnail";
import { type ImageVariantData } from "@/lib/api/confirm/types";

async function processVideoThumbnail(
  originalBuffer: Buffer,
  mimeType: string,
  projectId: string,
  fileId: string,
  storageAdapter: StorageAdapter,
): Promise<ImageVariantData | null> {
  try {
    const result = await generateThumbnailFromBuffer(originalBuffer, mimeType, {
      maxDimension: 800,
      format: "jpeg",
      timestamp: "00:00:01",
      timeout: 30000,
    });

    if (!result.success || !result.buffer) {
      return null;
    }

    const thumbnailMetadata = await sharp(result.buffer).metadata();

    const objectName = `${projectId}/${fileId}-thumbnail.jpg`;
    const url = await storageAdapter.uploadObject(
      objectName,
      result.buffer,
      "image/jpeg",
    );

    return {
      url,
      width: thumbnailMetadata.width || result.width || 800,
      height: thumbnailMetadata.height || result.height || 450,
      size: result.buffer.length,
      format: "jpeg",
      label: "thumbnail",
    };
  } catch (error) {
    console.error("Video thumbnail processing error:", error);
    return null;
  }
}

interface HandleVideoConfirmInput {
  projectId: string;
  fileId: string;
  objectName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  storageAdapter: StorageAdapter;
}

export async function handleVideoConfirm({
  projectId,
  fileId,
  objectName,
  fileName,
  contentType,
  fileSize,
  storageAdapter,
}: HandleVideoConfirmInput): Promise<NextResponse> {
  const objectUrl = storageAdapter.getObjectUrl(objectName);
  let thumbnail: ImageVariantData | null = null;
  let videoMetadata: VideoMetadata | null = null;

  try {
    const originalBuffer = await storageAdapter.downloadObject(objectName);
    videoMetadata = await getVideoMetadataFromBuffer(originalBuffer, contentType);
    thumbnail = await processVideoThumbnail(
      originalBuffer,
      contentType,
      projectId,
      fileId,
      storageAdapter,
    );
  } catch (thumbnailError) {
    console.warn(`Video processing skipped: ${thumbnailError}`);
  }

  const videoVariants: ImageVariantData[] = [];

  if (videoMetadata) {
    const sourceLabel = `${videoMetadata.width}x${videoMetadata.height}`;
    videoVariants.push({
      url: objectUrl,
      width: videoMetadata.width,
      height: videoMetadata.height,
      size: fileSize,
      format: contentType.split("/")[1] || "mp4",
      label: sourceLabel,
    });
  }

  if (thumbnail) {
    videoVariants.push(thumbnail);
  }

  const savedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      name: fileName,
      mimeType: contentType,
      isImage: false,
      size: fileSize,
      url: objectUrl,
      objectName,
      status: "COMPLETED",
      variants: videoVariants as Prisma.JsonArray,
    },
  });

  const response = NextResponse.json(
    {
      message: thumbnail ? "비디오 업로드 및 썸네일 생성 완료" : "비디오 업로드 완료",
      file: savedFile,
      variants: videoVariants,
    },
    { status: 201 },
  );

  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "video",
    hasThumbnail: thumbnail !== null,
    thumbnailUrl: thumbnail?.url,
  });

  return response;
}
