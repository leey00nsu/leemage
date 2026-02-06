"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";

export async function revokeApiKey(apiKeyId: string): Promise<void> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const { count } = await prisma.apiKey.deleteMany({
    where: {
      id: apiKeyId,
      userIdentifier,
    },
  });

  if (count === 0) {
    throw new Error("API 키를 찾을 수 없습니다.");
  }
}
