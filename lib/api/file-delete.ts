import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";
import { enqueueOwnedObjects } from "@/lib/storage/cleanup-queue";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";

export async function deleteFileHandler(
  fileId: string,
  projectId: string,
  userId: string,
) {
  try {
    if (!fileId) {
      return NextResponse.json(
        { message: "File ID is required." },
        { status: 400 },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required." },
        { status: 400 },
      );
    }

    const deleted = await prisma.$transaction(async (tx) => {
      const file = await tx.file.findFirst({
        where: { id: fileId, projectId, project: { userId } },
        select: { id: true },
      });
      if (!file) return false;

      await enqueueOwnedObjects(tx, { fileId, projectId });
      const result = await tx.file.deleteMany({ where: { id: fileId, projectId } });
      return result.count === 1;
    });
    if (!deleted)
      return NextResponse.json(
        { message: "Resource not found." },
        { status: 404 },
      );
    invalidateAllStorageCaches();

    return NextResponse.json(
      { message: "File deleted successfully. Storage cleanup was queued." },
      { status: 200 },
    );
  } catch (error) {
    apiLogger.error("file.delete.failed", getSafeErrorMetadata(error));
    return NextResponse.json(
      { message: "An error occurred while deleting the file." },
      { status: 500 },
    );
  }
}
