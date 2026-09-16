import type { NextRequest, NextResponse } from "next/server";
import { apiLogger } from "@/lib/logging/secure-logger";
import { observeHttpRequest } from "./metrics";
import { getOrCreateRequestId, normalizeApiRoute } from "./request-id";

export function completeRequest(
  request: NextRequest,
  response: NextResponse,
  startTime: number,
  authSource: "ui" | "apiKey",
) {
  const requestId = getOrCreateRequestId(request.headers);
  const route = normalizeApiRoute(new URL(request.url).pathname);
  const durationMs = Date.now() - startTime;
  response.headers.set("X-Request-Id", requestId);
  observeHttpRequest({
    method: request.method,
    route,
    statusCode: response.status,
    durationMs,
  });
  if (process.env.NODE_ENV !== "test") {
    apiLogger.info("request.completed", {
      requestId,
      method: request.method,
      route,
      statusCode: response.status,
      durationMs,
      authSource,
    });
  }
  return { requestId, durationMs };
}

export function logUnhandledRequestError(
  request: NextRequest,
  startTime: number,
  authSource: "ui" | "apiKey",
  error: unknown,
) {
  const requestId = getOrCreateRequestId(request.headers);
  const route = normalizeApiRoute(new URL(request.url).pathname);
  const durationMs = Date.now() - startTime;
  observeHttpRequest({
    method: request.method,
    route,
    statusCode: 500,
    durationMs,
  });
  if (process.env.NODE_ENV !== "test") {
    apiLogger.error("request.failed", {
      requestId,
      method: request.method,
      route,
      statusCode: 500,
      durationMs,
      authSource,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
  }
}
