import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authLogger, maskApiKey } from "@/lib/logging/secure-logger";
import {
  API_KEY_LOOKUP_PREFIX_LENGTH,
  API_KEY_PREFIX,
} from "@/shared/config/api-key";
import {
  DEFAULT_API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";
import type { ValidatedApiKey } from "@/lib/auth/api-key-auth/types";

function getClientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
}

function extractBearerToken(request: NextRequest): string | null {
  const authorizationHeader = request.headers.get("Authorization");
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    authLogger.security({
      type: "AUTH_FAILURE",
      ip: getClientIp(request),
      details: { reason: "Authorization 헤더 누락 또는 형식 오류" },
    });
    return null;
  }

  return authorizationHeader.substring(7);
}

function isValidApiKeyPrefix(providedApiKey: string): boolean {
  return Boolean(providedApiKey) && providedApiKey.startsWith(API_KEY_PREFIX);
}

function normalizePermissions(permissions: unknown): ApiKeyPermission[] {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return DEFAULT_API_KEY_PERMISSIONS;
  }

  return permissions as ApiKeyPermission[];
}

export async function validateApiKey(
  request: NextRequest,
): Promise<ValidatedApiKey | null> {
  const ip = getClientIp(request);
  const providedApiKey = extractBearerToken(request);
  if (!providedApiKey) {
    return null;
  }

  if (!isValidApiKeyPrefix(providedApiKey)) {
    authLogger.security({
      type: "AUTH_FAILURE",
      ip,
      details: {
        reason: "키 누락 또는 접두사 오류",
        prefix: maskApiKey(providedApiKey),
      },
    });
    return null;
  }

  const lookupPrefix = providedApiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);

  try {
    const apiKeyCandidates = await prisma.apiKey.findMany({
      where: {
        OR: [{ prefix: lookupPrefix }, { prefix: API_KEY_PREFIX }],
      },
      select: {
        id: true,
        keyHash: true,
        userIdentifier: true,
        name: true,
        prefix: true,
        permissions: true,
      },
    });

    if (!apiKeyCandidates.length) {
      authLogger.security({
        type: "AUTH_FAILURE",
        ip,
        details: { reason: "해당 접두사의 키를 찾을 수 없음" },
      });
      return null;
    }

    for (const apiKeyData of apiKeyCandidates) {
      const isValid = await bcrypt.compare(providedApiKey, apiKeyData.keyHash);
      if (!isValid) {
        continue;
      }

      try {
        await prisma.apiKey.update({
          where: { id: apiKeyData.id },
          data: { lastUsedAt: new Date() },
        });
      } catch (updateError) {
        authLogger.error("API Key lastUsedAt 업데이트 실패", {
          error: String(updateError),
        });
      }

      authLogger.security({
        type: "AUTH_SUCCESS",
        ip,
        details: { key: maskApiKey(providedApiKey) },
      });

      return {
        id: apiKeyData.id,
        userIdentifier: apiKeyData.userIdentifier,
        name: apiKeyData.name,
        prefix: apiKeyData.prefix,
        permissions: normalizePermissions(apiKeyData.permissions),
      };
    }

    authLogger.security({
      type: "AUTH_FAILURE",
      ip,
      details: { reason: "키 검증 실패", key: maskApiKey(providedApiKey) },
    });
    return null;
  } catch (error) {
    authLogger.error("API Key 검증 중 오류 발생", { error: String(error) });
    return null;
  }
}
