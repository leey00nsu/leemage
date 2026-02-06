import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  API_KEY_LOOKUP_PREFIX_LENGTH,
  API_KEY_PREFIX,
} from "@/shared/config/api-key";
import {
  DEFAULT_API_KEY_PERMISSIONS,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";
import { authLogger, maskApiKey } from "@/lib/logging/secure-logger";
import { logApiCall, extractProjectIdFromPath } from "@/lib/api/api-logger";

interface ValidatedApiKey {
  userIdentifier: string;
  permissions: ApiKeyPermission[];
}

const METHOD_PERMISSION_MAP: Partial<Record<string, ApiKeyPermission>> = {
  GET: "read",
  HEAD: "read",
  OPTIONS: "read",
  POST: "write",
  PUT: "write",
  PATCH: "write",
  DELETE: "delete",
};

function hasMethodPermission(
  method: string,
  permissions: ApiKeyPermission[]
): boolean {
  const requiredPermission = METHOD_PERMISSION_MAP[method.toUpperCase()];
  if (!requiredPermission) {
    return true;
  }

  return permissions.includes(requiredPermission);
}

/**
 * API 요청 헤더에서 API 키를 추출하고 유효성을 검증합니다.
 * @param request NextRequest 객체
 * @returns 키가 유효하면 사용자/권한 정보를 반환, 그렇지 않으면 null을 반환합니다.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ValidatedApiKey | null> {
  const authorizationHeader = request.headers.get("Authorization");
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    authLogger.security({
      type: "AUTH_FAILURE",
      ip,
      details: { reason: "Authorization 헤더 누락 또는 형식 오류" },
    });
    return null;
  }

  const providedApiKey = authorizationHeader.substring(7); // "Bearer " 제거
  const lookupPrefix = providedApiKey.slice(0, API_KEY_LOOKUP_PREFIX_LENGTH);

  if (!providedApiKey || !providedApiKey.startsWith(API_KEY_PREFIX)) {
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

  try {
    // prefix 기반 조회 + legacy 데이터(prefix=lmk_) fallback 조회
    const apiKeyCandidates = await prisma.apiKey.findMany({
      where: {
        OR: [{ prefix: lookupPrefix }, { prefix: API_KEY_PREFIX }],
      },
      select: {
        id: true,
        keyHash: true,
        userIdentifier: true,
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
        userIdentifier: apiKeyData.userIdentifier,
        permissions:
          apiKeyData.permissions.length > 0
            ? (apiKeyData.permissions as ApiKeyPermission[])
            : DEFAULT_API_KEY_PERMISSIONS,
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

/**
 * API 라우트 핸들러를 감싸 API 키 인증을 추가하는 HOF(Higher-Order Function)
 * Next.js App Router의 타입 시스템과 완전히 호환됩니다.
 * @param handler 보호할 API 라우트 핸들러 (userId가 추가됨)
 * @returns 인증 로직이 추가된 새로운 핸들러
 */
export function withApiKeyAuth<T extends Record<string, string | string[]>>(
  handler: (
    req: NextRequest,
    context: { params: Promise<T> },
    userId: string
  ) => Promise<NextResponse> | NextResponse
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const pathname = new URL(req.url).pathname;
    const method = req.method;

    const validatedKey = await validateApiKey(req);
    if (!validatedKey) {
      // 인증 실패도 로깅 (userId는 "anonymous")
      logApiCall({
        userId: "anonymous",
        projectId: extractProjectIdFromPath(pathname),
        endpoint: pathname,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
      });

      return new NextResponse(
        JSON.stringify({ message: "인증 실패: 유효하지 않은 API 키" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!hasMethodPermission(method, validatedKey.permissions)) {
      logApiCall({
        userId: validatedKey.userIdentifier,
        projectId: extractProjectIdFromPath(pathname),
        endpoint: pathname,
        method,
        statusCode: 403,
        durationMs: Date.now() - startTime,
      });

      return new NextResponse(
        JSON.stringify({ message: "권한 부족: 요청 메서드 권한이 없습니다." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 인증 성공 시 원래 핸들러 실행 (userId 전달)
    const response = await handler(req, context, validatedKey.userIdentifier);

    // 응답 후 비동기로 로그 저장 (논블로킹)
    logApiCall({
      userId: validatedKey.userIdentifier,
      projectId: extractProjectIdFromPath(pathname),
      endpoint: pathname,
      method,
      statusCode: response.status,
      durationMs: Date.now() - startTime,
    });

    return response;
  };
}
