import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateAllStorageCaches } from "@/lib/api/storage-quota";
import { enqueueOwnedObjects } from "@/lib/storage/cleanup-queue";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";
import { Prisma } from "@/lib/generated/prisma";
import { deleteFilesSchema } from "@/shared/lib/file-delete";

export async function deleteFilesRequestHandler(
  request: Request,
  projectId: string,
  userId: string,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid delete request." }, { status: 400 });
  }
  const result = deleteFilesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ message: "Invalid delete request." }, { status: 400 });
  }
  return deleteFilesHandler(result.data.fileIds, projectId, userId);
}

export async function deleteFileHandler(
  fileId: string,
  projectId: string,
  userId: string,
) {
  return deleteFilesHandler([fileId], projectId, userId);
}

export async function deleteFilesHandler(
  requestedIds: string[],
  projectId: string,
  userId: string,
) {
  try {
    const parsed = deleteFilesSchema.safeParse({ fileIds: requestedIds });
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid delete request." },
        { status: 400 },
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID is required." },
        { status: 400 },
      );
    }

    const { fileIds } = parsed.data;
    const deleted = await prisma.$transaction(async (tx) => {
      // Lock every owned file until both the outbox and deletion commit.
      // A mixed/foreign batch must never partially delete or enqueue objects.
      const files = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT f.id FROM "File" f
        INNER JOIN "Project" p ON p.id = f."projectId"
        WHERE f.id IN (${Prisma.join(fileIds)})
          AND f."projectId" = ${projectId} AND p."userId" = ${userId}
        ORDER BY f.id
        FOR UPDATE OF f
      `);
      if (files.length !== fileIds.length) return false;

      await enqueueOwnedObjects(tx, { fileIds });
      const result = await tx.file.deleteMany({
        where: { id: { in: fileIds }, projectId },
      });
      if (result.count !== fileIds.length) throw new Error("FILE_DELETE_COUNT_MISMATCH");
      return true;
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
