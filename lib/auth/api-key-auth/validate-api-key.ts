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
import { getClientIp } from "@/lib/http/client-ip";
import {
  hashApiKey,
  isSha256ApiKeyHash,
  matchesSha256ApiKey,
} from "@/lib/auth/api-key-auth/hash";

const LAST_USED_WRITE_INTERVAL_MS = 5 * 60 * 1000;

function extractBearerToken(request: NextRequest): string | null {
  const authorizationHeader = request.headers.get("Authorization");
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    authLogger.security({
      type: "AUTH_FAILURE",
      ip: getClientIp(request),
      details: { reason: "Missing or invalid Authorization header format" },
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
        reason: "Missing API key or invalid key prefix",
        prefix: maskApiKey(providedApiKey),
      },
    });
    return null;
  }

  const lookupPrefix = providedApiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);
  const now = new Date();

  try {
    const apiKeyCandidates = await prisma.apiKey.findMany({
      where: {
        OR: [{ prefix: lookupPrefix }, { prefix: API_KEY_PREFIX }],
        AND: [
          {
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        ],
      },
      select: {
        id: true,
        keyHash: true,
        userIdentifier: true,
        name: true,
        prefix: true,
        permissions: true,
        lastUsedAt: true,
      },
    });

    if (!apiKeyCandidates.length) {
      authLogger.security({
        type: "AUTH_FAILURE",
        ip,
        details: { reason: "No API key found for the provided prefix" },
      });
      return null;
    }

    for (const apiKeyData of apiKeyCandidates) {
      const usesSha256 = isSha256ApiKeyHash(apiKeyData.keyHash);
      const isValid = usesSha256
        ? matchesSha256ApiKey(providedApiKey, apiKeyData.keyHash)
        : await bcrypt.compare(providedApiKey, apiKeyData.keyHash);
      if (!isValid) {
        continue;
      }

      const lastUsedCutoff = new Date(
        now.getTime() - LAST_USED_WRITE_INTERVAL_MS,
      );
      if (
        !usesSha256 ||
        !apiKeyData.lastUsedAt ||
        apiKeyData.lastUsedAt < lastUsedCutoff
      ) {
        try {
          await prisma.apiKey.updateMany({
            where: usesSha256
              ? {
                  id: apiKeyData.id,
                  OR: [
                    { lastUsedAt: null },
                    { lastUsedAt: { lt: lastUsedCutoff } },
                  ],
                }
              : { id: apiKeyData.id, keyHash: apiKeyData.keyHash },
            data: {
              lastUsedAt: now,
              ...(!usesSha256 && { keyHash: hashApiKey(providedApiKey) }),
            },
          });
        } catch (updateError) {
          authLogger.error("Failed to refresh API key metadata", {
            error: String(updateError),
          });
        }
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
      details: { reason: "API key verification failed", key: maskApiKey(providedApiKey) },
    });
    return null;
  } catch (error) {
    authLogger.error("Error occurred during API key validation", { error: String(error) });
    return null;
  }
}
