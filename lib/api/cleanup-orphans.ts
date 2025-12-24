import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";

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

  const errors: string[] = [];

  try {
    // 오래된 PENDING 레코드 조회
    const orphanFiles = await prisma.file.findMany({
      where: {
        status: "PENDING",
        createdAt: {
          lt: cutoffTime,
        },
      },
      select: {
        id: true,
        objectName: true,
      },
    });

    if (orphanFiles.length === 0) {
      console.log("No orphan files to clean up.");
      return { deletedCount: 0, errors: [] };
    }

    console.log(`Found ${orphanFiles.length} orphan files to clean up.`);

    // OCI 객체 삭제
    for (const file of orphanFiles) {
      if (file.objectName) {
        try {
          await deleteObject(file.objectName);
          console.log(`Deleted OCI object: ${file.objectName}`);
        } catch (error) {
          const errorMsg = `Failed to delete OCI object ${file.objectName}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }
    }

    // DB 레코드 삭제 (또는 FAILED 상태로 변경)
    const deleteResult = await prisma.file.deleteMany({
      where: {
        id: {
          in: orphanFiles.map((f) => f.id),
        },
        status: "PENDING",
      },
    });

    console.log(`Deleted ${deleteResult.count} orphan file records.`);

    return { deletedCount: deleteResult.count, errors };
  } catch (error) {
    console.error("Error during orphan cleanup:", error);
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
    const deleteResult = await prisma.file.deleteMany({
      where: {
        status: "FAILED",
        createdAt: {
          lt: cutoffTime,
        },
      },
    });

    console.log(`Deleted ${deleteResult.count} failed file records.`);

    return { deletedCount: deleteResult.count };
  } catch (error) {
    console.error("Error during failed files cleanup:", error);
    throw error;
  }
}
