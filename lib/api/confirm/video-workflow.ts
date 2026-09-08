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
  const file = await prisma.$transaction(async (tx) => {
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
    if (!result.count) throw new Error("File already confirmed");
    if (videoThumbnailEnabled)
      await tx.videoJob.create({ data: { id: fileId } });
    return tx.file.findUniqueOrThrow({ where: { id: fileId } });
  });
  invalidateAllStorageCaches();
  return NextResponse.json(
    { message: "Video upload complete", file, variants: [] },
    { status: 201 },
  );
}
