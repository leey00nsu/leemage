"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";
import {
  API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";

const MAX_API_KEY_NAME_LENGTH = 60;

interface RenameApiKeyInput {
  apiKeyId: string;
  name: string;
  permissions: ApiKeyPermission[];
}

export async function renameApiKey(input: RenameApiKeyInput): Promise<void> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new Error("키 이름을 입력해주세요.");
  }

  if (trimmedName.length > MAX_API_KEY_NAME_LENGTH) {
    throw new Error(`키 이름은 ${MAX_API_KEY_NAME_LENGTH}자 이하여야 합니다.`);
  }

  const sanitizedPermissions = Array.from(new Set(input.permissions)).filter(
    (permission): permission is ApiKeyPermission =>
      API_KEY_PERMISSIONS.includes(permission),
  );

  if (sanitizedPermissions.length === 0) {
    throw new Error("최소 1개 이상의 권한을 선택해주세요.");
  }

  const { count } = await prisma.apiKey.updateMany({
    where: {
      id: input.apiKeyId,
      userIdentifier,
    },
    data: {
      name: trimmedName,
      permissions: sanitizedPermissions,
    },
  });

  if (count === 0) {
    throw new Error("API 키를 찾을 수 없습니다.");
  }
}
