import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logApiCall, extractProjectIdFromPath } from "@/lib/api/api-logger";
import { consumeResponseLogMetadata } from "@/lib/api/request-log-metadata";
import { hasMethodPermission } from "@/lib/auth/api-key-auth/permissions";
import { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";
import {
  applyRateLimitHeaders,
  checkIdentityRateLimit,
  createRateLimitResponse,
} from "@/lib/auth/rate-limiter";
import {
  completeRequest,
  logUnhandledRequestError,
} from "@/lib/observability/request";
import { maskApiKey } from "@/lib/logging/secure-logger";

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
    userId: string,
  ) => Promise<NextResponse> | NextResponse,
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> },
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const pathname = new URL(req.url).pathname;
    const method = req.method;

    const validatedKey = await validateApiKey(req);
    if (!validatedKey) {
      const response = NextResponse.json(
        { message: "Authentication failed: invalid API key" },
        { status: 401 },
      );
      const { requestId, durationMs } = completeRequest(
        req,
        response,
        startTime,
        "apiKey",
      );
      logApiCall({
        userId: "anonymous",
        projectId: extractProjectIdFromPath(pathname),
        endpoint: pathname,
        method,
        statusCode: 401,
        durationMs,
        metadata: {
          authSource: "apiKey",
          requestId,
        },
      });
      return response;
    }

    if (!hasMethodPermission(method, validatedKey.permissions)) {
      const response = NextResponse.json(
        { message: "Insufficient permissions: method access denied." },
        { status: 403 },
      );
      const { requestId, durationMs } = completeRequest(
        req,
        response,
        startTime,
        "apiKey",
      );
      logApiCall({
        userId: validatedKey.userIdentifier,
        projectId: extractProjectIdFromPath(pathname),
        endpoint: pathname,
        method,
        statusCode: 403,
        durationMs,
        metadata: {
          authSource: "apiKey",
          apiKeyId: validatedKey.id,
          apiKeyName: validatedKey.name,
          apiKeyPrefix: maskApiKey(validatedKey.prefix),
          requestId,
        },
      });
      return response;
    }

    const rateLimit = checkIdentityRateLimit(
      req,
      `api-key:${validatedKey.id}`,
    );
    if (!rateLimit.allowed) {
      const response = createRateLimitResponse(rateLimit);
      completeRequest(req, response, startTime, "apiKey");
      return response;
    }

    let response: NextResponse;
    try {
      response = await handler(req, context, validatedKey.userIdentifier);
    } catch (error) {
      logUnhandledRequestError(req, startTime, "apiKey", error);
      throw error;
    }
    const extraMetadata = consumeResponseLogMetadata(response);
    const finalResponse = applyRateLimitHeaders(response, rateLimit);
    const { requestId, durationMs } = completeRequest(
      req,
      finalResponse,
      startTime,
      "apiKey",
    );

    logApiCall({
      userId: validatedKey.userIdentifier,
      projectId: extractProjectIdFromPath(pathname),
      endpoint: pathname,
      method,
      statusCode: response.status,
      durationMs,
      metadata: {
        ...(extraMetadata ?? {}),
        authSource: "apiKey",
        apiKeyId: validatedKey.id,
        apiKeyName: validatedKey.name,
        apiKeyPrefix: maskApiKey(validatedKey.prefix),
        requestId,
      },
    });

    return finalResponse;
  };
}

export { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";
