"use server";

import { prisma } from "@/lib/prisma";

const ADMIN_IDENTIFIER = "admin_user"; // 고정된 관리자 식별자

/**
 * 시스템의 API 키를 삭제(무효화)합니다.
 */
export async function deleteApiKey(): Promise<void> {
  // 시스템의 모든 API 키 삭제 (어차피 하나만 존재 가정)
  const { count } = await prisma.apiKey.deleteMany({
    where: {
      userIdentifier: ADMIN_IDENTIFIER, // 안전하게 식별자 지정
    },
  });

  if (count > 0) {
    console.log(`API 키 (${count}개)가 성공적으로 삭제되었습니다.`);
  } else {
    console.log("삭제할 API 키가 없습니다.");
  }

  // revalidatePath(...);
}
