"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";

/**
 * 시스템의 API 키를 삭제(무효화)합니다.
 */
export async function deleteApiKey(): Promise<void> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  // 시스템의 모든 API 키 삭제 (어차피 하나만 존재 가정)
  const { count } = await prisma.apiKey.deleteMany();

  if (count > 0) {
    console.log(`API 키 (${count}개)가 성공적으로 삭제되었습니다.`);
  } else {
    console.log("삭제할 API 키가 없습니다.");
  }

  // revalidatePath(...);
}
