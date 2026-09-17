"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";
import { apiLogger } from "@/lib/logging/secure-logger";

/**
 * 시스템의 API 키를 삭제(무효화)합니다.
 */
export async function deleteApiKey(): Promise<void> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  // 현재 로그인한 사용자의 API 키만 삭제
  const { count } = await prisma.apiKey.deleteMany({
    where: {
      userIdentifier,
    },
  });

  apiLogger.info("api-key.delete.completed", { deletedCount: count });

  // revalidatePath(...);
}
