"use server";

import { prisma } from "@/lib/prisma";

/**
 * 시스템에 설정된 API 키의 접두사 정보를 가져옵니다.
 * 실제 키 해시는 반환하지 않습니다.
 * @returns API 키 정보 객체 { prefix: string | null } 또는 키가 없으면 null
 */
export async function getApiKeyInfo(): Promise<{
  prefix: string | null;
} | null> {
  const apiKey = await prisma.apiKey.findFirst({
    select: {
      prefix: true,
    },
  });

  return apiKey ? { prefix: apiKey.prefix } : null;
}
