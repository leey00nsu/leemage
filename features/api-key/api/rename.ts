"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";

const MAX_API_KEY_NAME_LENGTH = 60;

export async function renameApiKey(
  apiKeyId: string,
  nextName: string
): Promise<void> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const trimmedName = nextName.trim();
  if (!trimmedName) {
    throw new Error("키 이름을 입력해주세요.");
  }

  if (trimmedName.length > MAX_API_KEY_NAME_LENGTH) {
    throw new Error(`키 이름은 ${MAX_API_KEY_NAME_LENGTH}자 이하여야 합니다.`);
  }

  const { count } = await prisma.apiKey.updateMany({
    where: {
      id: apiKeyId,
      userIdentifier,
    },
    data: {
      name: trimmedName,
    },
  });

  if (count === 0) {
    throw new Error("API 키를 찾을 수 없습니다.");
  }
}
