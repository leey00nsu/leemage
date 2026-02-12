import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logApiCall, extractProjectIdFromPath } from "@/lib/api/api-logger";
import { consumeResponseLogMetadata } from "@/lib/api/request-log-metadata";
import { hasMethodPermission } from "@/lib/auth/api-key-auth/permissions";
import { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";

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
      logApiCall({
        userId: "anonymous",
        projectId: extractProjectIdFromPath(pathname),
        endpoint: pathname,
        method,
        statusCode: 401,
        durationMs: Date.now() - startTime,
        metadata: {
          authSource: "apiKey",
        },
      });

      return new NextResponse(
        JSON.stringify({ message: "Authentication failed: invalid API key" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
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
        metadata: {
          authSource: "apiKey",
          apiKeyId: validatedKey.id,
          apiKeyName: validatedKey.name,
          apiKeyPrefix: validatedKey.prefix,
        },
      });

      return new NextResponse(
        JSON.stringify({ message: "Insufficient permissions: method access denied." }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await handler(req, context, validatedKey.userIdentifier);
    const extraMetadata = consumeResponseLogMetadata(response);

    logApiCall({
      userId: validatedKey.userIdentifier,
      projectId: extractProjectIdFromPath(pathname),
      endpoint: pathname,
      method,
      statusCode: response.status,
      durationMs: Date.now() - startTime,
      metadata: {
        ...(extraMetadata ?? {}),
        authSource: "apiKey",
        apiKeyId: validatedKey.id,
        apiKeyName: validatedKey.name,
        apiKeyPrefix: validatedKey.prefix,
      },
    });

    return response;
  };
}

export { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";
