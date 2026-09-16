/**
 * API 호출 로깅 유틸리티
 * API 호출을 DB에 기록합니다.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { apiLogger } from "@/lib/logging/secure-logger";
import { recordDroppedApiLogs } from "@/lib/observability/metrics";

const BATCH_SIZE = 100;
const MAX_QUEUE_SIZE = 1_000;
const FLUSH_INTERVAL_MS = 250;
const queue: Prisma.ApiLogCreateManyInput[] = [];
let flushTimer: NodeJS.Timeout | undefined;
let flushing: Promise<void> | undefined;

export interface ApiLogData {
  userId: string;
  projectId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs?: number;
  metadata?: Record<string, unknown>; // 추가 정보 (파일명 등)
}

/**
 * API 호출을 DB에 기록합니다.
 * 비동기로 실행되며, 에러가 발생해도 API 응답에 영향을 주지 않습니다.
 */
export async function logApiCall(data: ApiLogData): Promise<void> {
  if (process.env.NODE_ENV === "test" && process.env.API_LOGGING_IN_TESTS !== "true") {
    return;
  }
  if (queue.length >= MAX_QUEUE_SIZE) {
    recordDroppedApiLogs(1);
    return;
  }
  queue.push({
    userId: data.userId,
    projectId: data.projectId || null,
    endpoint: data.endpoint,
    method: data.method,
    statusCode: data.statusCode,
    durationMs: data.durationMs,
    metadata: data.metadata as Prisma.InputJsonValue | undefined,
  });

  if (queue.length >= BATCH_SIZE) {
    void flushApiLogs();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => void flushApiLogs(), FLUSH_INTERVAL_MS);
    flushTimer.unref?.();
  }
}

export async function flushApiLogs(): Promise<void> {
  if (flushing) return flushing;
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = undefined;
  const batch = queue.splice(0, BATCH_SIZE);
  if (batch.length === 0) return;

  flushing = prisma.apiLog
    .createMany({ data: batch })
    .then(() => undefined)
    .catch(() => {
      recordDroppedApiLogs(batch.length);
      apiLogger.warn("api_log.batch_dropped", { count: batch.length });
    })
    .finally(() => {
      flushing = undefined;
      if (queue.length > 0) {
        flushTimer = setTimeout(() => void flushApiLogs(), FLUSH_INTERVAL_MS);
        flushTimer.unref?.();
      }
    });
  return flushing;
}

/**
 * 엔드포인트 경로에서 projectId를 추출합니다.
 * 예: "/v1/projects/abc123/files" -> "abc123"
 */
export function extractProjectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/v1\/projects\/([^/]+)/);
  return match ? match[1] : undefined;
}
