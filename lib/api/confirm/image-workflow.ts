import { NextResponse } from "next/server";
import { Prisma } from "@/lib/generated/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";
import type { VariantOption } from "@/lib/api/confirm/types";
import type { StorageProvider } from "@/lib/generated/prisma";
import { enqueueUploadCleanup } from "@/lib/api/confirm/promote-upload";

interface HandleImageConfirmInput {
  projectId: string;
  fileId: string;
  objectName: string;
  uploadObjectName: string;
  cleanupProvider: StorageProvider;
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
  uploadObjectName,
  cleanupProvider,
  fileName,
  contentType,
  fileSize,
  variants,
  storageAdapter,
}: HandleImageConfirmInput): Promise<NextResponse> {
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.file.updateMany({
      where: {
        id: fileId,
        projectId,
        status: "PENDING",
        processingStatus: "NONE",
      },
      data: {
        name: fileName,
        mimeType: contentType,
        isImage: true,
        size: fileSize,
        url: storageAdapter.getObjectUrl(objectName),
        objectName,
        uploadObjectName: null,
        uploadTokenHash: null,
        uploadExpiresAt: null,
        status: "COMPLETED",
        uploadedAt: new Date(),
        processingStatus: "QUEUED",
        variants: [],
      },
    });

    if (claimed.count) {
      await enqueueUploadCleanup(tx, cleanupProvider, uploadObjectName);
      await tx.imageJob.create({
        data: {
          id: fileId,
          variants: variants as Prisma.JsonArray,
        },
      });
    }

    const file = await tx.file.findUnique({ where: { id: fileId } });
    if (!file || file.status !== "COMPLETED") {
      throw new Error("Image confirmation was not claimed");
    }
    return { file, created: claimed.count === 1 };
  });

  invalidateAllStorageCaches();
  const response = NextResponse.json(
    {
      message: result.created
        ? "Image upload accepted for processing"
        : "Image upload was already confirmed",
      file: { ...result.file, thumbnail: null },
      variants: result.file.variants,
    },
    { status: result.created ? 202 : 200 },
  );
  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "image",
    processingStatus: result.file.processingStatus,
  });
  return response;
}
