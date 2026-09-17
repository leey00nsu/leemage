import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";
import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";
import type { StorageProvider } from "@/lib/generated/prisma";
import { enqueueUploadCleanup } from "@/lib/api/confirm/promote-upload";

interface HandleOtherConfirmInput {
  fileId: string;
  objectName: string;
  uploadObjectName: string;
  cleanupProvider: StorageProvider;
  fileName: string;
  contentType: string;
  fileSize: number;
  storageAdapter: StorageAdapter;
}

export async function handleOtherConfirm({
  fileId,
  objectName,
  uploadObjectName,
  cleanupProvider,
  fileName,
  contentType,
  fileSize,
  storageAdapter,
}: HandleOtherConfirmInput): Promise<NextResponse> {
  const objectUrl = storageAdapter.getObjectUrl(objectName);

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.file.updateMany({
      where: { id: fileId, status: "PENDING" },
      data: {
        name: fileName,
        mimeType: contentType,
        isImage: false,
        size: fileSize,
        url: objectUrl,
        objectName,
        uploadObjectName: null,
        uploadTokenHash: null,
        uploadExpiresAt: null,
        status: "COMPLETED",
        uploadedAt: new Date(),
        variants: [],
      },
    });
    if (claimed.count) {
      await enqueueUploadCleanup(tx, cleanupProvider, uploadObjectName);
    }
    const file = await tx.file.findUnique({ where: { id: fileId } });
    if (!file || file.status !== "COMPLETED") {
      throw new Error("File confirmation was not claimed");
    }
    return { file, created: claimed.count === 1 };
  });

  const response = NextResponse.json(
    {
      message: result.created
        ? "File upload complete"
        : "File upload was already confirmed",
      file: result.file,
    },
    { status: result.created ? 201 : 200 },
  );

  invalidateAllStorageCaches();

  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "other",
  });

  return response;
}
