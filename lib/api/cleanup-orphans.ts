import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { enqueueOwnedObjects } from "@/lib/storage/cleanup-queue";
import { getSafeErrorMetadata, workerLogger } from "@/lib/logging/secure-logger";

async function cleanupFiles(
  status: "PENDING" | "FAILED",
  cutoff: Date,
  lockName: string,
) {
  return prisma.$transaction(async (tx) => {
    const lock = await tx.$queryRaw<{ locked: boolean }[]>(Prisma.sql`
      SELECT pg_try_advisory_xact_lock(hashtext(${lockName})) AS locked
    `);
    if (!lock[0]?.locked) return 0;

    const files = await tx.file.findMany({
      where: { status, createdAt: { lt: cutoff } },
      orderBy: { createdAt: "asc" },
      take: 100,
      select: { id: true },
    });
    if (files.length === 0) return 0;

    const fileIds = files.map((file) => file.id);
    await enqueueOwnedObjects(tx, { fileIds });
    const result = await tx.file.deleteMany({
      where: { id: { in: fileIds }, status, createdAt: { lt: cutoff } },
    });
    return result.count;
  });
}

/**
 * 고아 오브젝트 정리
 * - PENDING 상태이면서 생성된 지 일정 시간이 지난 레코드를 찾아 삭제
 * - 해당 레코드의 OCI 객체도 함께 삭제
 *
 * @param olderThanMinutes 이 시간(분)보다 오래된 pending 레코드 정리 (기본: 30분)
 */
export async function cleanupOrphanFiles(
  olderThanMinutes: number = 30
): Promise<{ deletedCount: number; errors: string[] }> {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

  try {
    const deletedCount = await cleanupFiles(
      "PENDING",
      cutoffTime,
      "maintenance:pending-files",
    );
    return { deletedCount, errors: [] };
  } catch (error) {
    workerLogger.error("pending-file-cleanup.failed", getSafeErrorMetadata(error));
    throw error;
  }
}

/**
 * FAILED 상태의 파일 정리
 * - FAILED 상태이면서 생성된 지 일정 시간이 지난 레코드를 삭제
 *
 * @param olderThanDays 이 시간(일)보다 오래된 failed 레코드 정리 (기본: 7일)
 */
export async function cleanupFailedFiles(
  olderThanDays: number = 7
): Promise<{ deletedCount: number }> {
  const cutoffTime = new Date();
  cutoffTime.setDate(cutoffTime.getDate() - olderThanDays);

  try {
    const deletedCount = await cleanupFiles(
      "FAILED",
      cutoffTime,
      "maintenance:failed-files",
    );
    return { deletedCount };
  } catch (error) {
    workerLogger.error("failed-file-cleanup.failed", getSafeErrorMetadata(error));
    throw error;
  }
}
