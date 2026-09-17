import type { StorageAdapter } from "@/lib/storage";
import type { Prisma, StorageProvider } from "@/lib/generated/prisma";
import { enqueueStorageObjectsInTransaction } from "@/lib/storage/cleanup-queue";

interface PromoteUploadInput {
  storageAdapter: StorageAdapter;
  uploadObjectName: string;
  finalObjectName: string;
  expectedSize: number;
  sourceRevision: string;
}

/**
 * Promote an upload into a server-only object name. If another concurrent
 * confirm already promoted the same upload, the verified destination makes
 * the operation idempotent.
 */
export async function promoteUpload({
  storageAdapter,
  uploadObjectName,
  finalObjectName,
  expectedSize,
  sourceRevision,
}: PromoteUploadInput) {
  try {
    await storageAdapter.promoteObject(
      uploadObjectName,
      finalObjectName,
      sourceRevision,
    );
  } catch (promotionError) {
    try {
      const existing = await storageAdapter.getObjectMetadata(finalObjectName);
      if (existing.size === expectedSize) return;
    } catch {
      // Preserve the original promotion failure when no valid destination
      // exists. It contains provider context for the secure server log.
    }
    throw promotionError;
  }

  const promoted = await storageAdapter.getObjectMetadata(finalObjectName);
  if (promoted.size !== expectedSize) {
    throw new Error("PROMOTED_OBJECT_SIZE_MISMATCH");
  }
}

export async function enqueueUploadCleanup(
  tx: Prisma.TransactionClient,
  provider: StorageProvider,
  uploadObjectName: string,
) {
  await enqueueStorageObjectsInTransaction(
    tx,
    provider,
    [uploadObjectName],
    new Date(Date.now() + 20 * 60 * 1000),
  );
}
