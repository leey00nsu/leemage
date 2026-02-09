"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";
import { Prisma } from "@/lib/generated/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  API_KEY_LOOKUP_PREFIX_LENGTH,
  API_KEY_PREFIX,
  SALT_ROUNDS,
} from "@/shared/config/api-key";
import {
  API_KEY_PERMISSIONS,
  DEFAULT_API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";

const MAX_API_KEY_NAME_LENGTH = 60;

export interface GenerateApiKeyInput {
  name?: string;
  permissions?: ApiKeyPermission[];
}

/**
 * 새 API 키를 생성합니다.
 * 생성된 평문 키는 재표시할 수 없으므로 즉시 사용자에게 반환합니다.
 * @returns 생성된 API 키 (prefix 포함, 이 값은 저장되지 않으므로 즉시 사용자에게 보여줘야 함)
 */
export async function generateApiKey(input?: GenerateApiKeyInput): Promise<string> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const keyCount = await prisma.apiKey.count({
    where: { userIdentifier },
  });

  // API 키는 서버에서만 생성합니다.
  const newApiKey = `${API_KEY_PREFIX}${crypto.randomBytes(24).toString("hex")}`;

  const keyLookupPrefix = newApiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);
  const keyHash = await bcrypt.hash(newApiKey, SALT_ROUNDS);
  const name = input?.name?.trim();
  const resolvedName =
    name && name.length > 0 ? name : `API Key ${keyCount + 1}`;

  if (resolvedName.length > MAX_API_KEY_NAME_LENGTH) {
    throw new Error(`키 이름은 ${MAX_API_KEY_NAME_LENGTH}자 이하여야 합니다.`);
  }

  const requestedPermissions = input?.permissions ?? DEFAULT_API_KEY_PERMISSIONS;
  const sanitizedPermissions = Array.from(new Set(requestedPermissions)).filter(
    (permission): permission is ApiKeyPermission =>
      API_KEY_PERMISSIONS.includes(permission)
  );

  if (sanitizedPermissions.length === 0) {
    throw new Error("최소 1개 이상의 권한을 선택해주세요.");
  }

  // DB에 새 API 키 생성
  try {
    await prisma.apiKey.create({
      data: {
        keyHash: keyHash,
        prefix: keyLookupPrefix,
        userIdentifier,
        name: resolvedName,
        permissions: sanitizedPermissions,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new Error("API 키 생성 중 충돌이 발생했습니다. 다시 시도해주세요.");
    }
    throw error;
  }

  return newApiKey;
}
