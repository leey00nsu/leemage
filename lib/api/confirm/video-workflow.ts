import { NextResponse } from "next/server";
import type { StorageAdapter } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";

interface HandleVideoConfirmInput {
  projectId: string;
  fileId: string;
  objectName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  storageAdapter: StorageAdapter;
  videoThumbnailEnabled?: boolean;
}

export async function handleVideoConfirm({
  fileId,
  objectName,
  fileName,
  contentType,
  fileSize,
  storageAdapter,
  videoThumbnailEnabled = true,
}: HandleVideoConfirmInput): Promise<NextResponse> {
  const result = await prisma.$transaction(async (tx) => {
    const result = await tx.file.updateMany({
      where: { id: fileId, status: "PENDING" },
      data: {
        name: fileName,
        mimeType: contentType,
        isImage: false,
        size: fileSize,
        url: storageAdapter.getObjectUrl(objectName),
        objectName,
        status: "COMPLETED",
        uploadedAt: new Date(),
        processingStatus: videoThumbnailEnabled ? "QUEUED" : "SKIPPED",
        variants: [],
      },
    });
    if (!result.count) {
      const existing = await tx.file.findUnique({ where: { id: fileId } });
      if (existing?.status === "COMPLETED") {
        return { file: existing, created: false };
      }
      throw new Error("File confirmation was not claimed");
    }
    if (videoThumbnailEnabled)
      await tx.videoJob.create({ data: { id: fileId } });
    const file = await tx.file.findUniqueOrThrow({ where: { id: fileId } });
    return { file, created: true };
  });
  invalidateAllStorageCaches();
  return NextResponse.json(
    {
      message: result.created
        ? "Video upload complete"
        : "Video upload was already confirmed",
      file: result.file,
      variants: result.file.variants,
    },
    { status: result.created ? 201 : 200 },
  );
}
