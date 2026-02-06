"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  API_KEY_LOOKUP_PREFIX_LENGTH,
  API_KEY_PREFIX,
  SALT_ROUNDS,
} from "@/shared/config/api-key";

/**
 * 새 API 키를 생성합니다.
 * 생성된 평문 키는 재표시할 수 없으므로 즉시 사용자에게 반환합니다.
 * @returns 생성된 API 키 (prefix 포함, 이 값은 저장되지 않으므로 즉시 사용자에게 보여줘야 함)
 */
export async function generateApiKey(): Promise<string> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const keyCount = await prisma.apiKey.count({
    where: { userIdentifier },
  });

  // 새 API 키 생성 (복수 키 지원)
  const newApiKey = `${API_KEY_PREFIX}${crypto
    .randomBytes(24)
    .toString("hex")}`;
  const keyLookupPrefix = newApiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);
  const keyHash = await bcrypt.hash(newApiKey, SALT_ROUNDS);

  // DB에 새 API 키 생성
  await prisma.apiKey.create({
    data: {
      keyHash: keyHash,
      prefix: keyLookupPrefix,
      userIdentifier,
      name: `API Key ${keyCount + 1}`,
    },
  });

  return newApiKey;
}
