/**
 * API 호출 로깅 유틸리티
 * API 호출을 DB에 기록합니다.
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";

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
  try {
    await prisma.apiLog.create({
      data: {
        userId: data.userId,
        projectId: data.projectId || null,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        durationMs: data.durationMs,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (error) {
    // 로깅 실패는 조용히 처리 (API 응답에 영향 X)
    console.error("API 로그 저장 실패:", error);
  }
}

/**
 * 엔드포인트 경로에서 projectId를 추출합니다.
 * 예: "/v1/projects/abc123/files" -> "abc123"
 */
export function extractProjectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/\/v1\/projects\/([^/]+)/);
  return match ? match[1] : undefined;
}
