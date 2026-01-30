/**
 * API 사용 통계 조회 API
 * 사용자의 API 호출 통계를 제공합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSessionDefault } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getSessionDefault();

  if (!session?.username) {
    return NextResponse.json(
      { message: "인증이 필요합니다." },
      { status: 401 },
    );
  }

  const userId = session.username;
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  // 월별 조회: startDate, endDate (ISO 문자열)
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  // 기본값: 현재 월
  const now = new Date();
  const startDate = startDateParam
    ? new Date(startDateParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = endDateParam
    ? new Date(endDateParam)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  try {
    // 기본 필터: 사용자별
    const baseWhere = {
      userId,
      ...(projectId && { projectId }),
    };

    // 기간 필터
    const periodWhere = {
      ...baseWhere,
      createdAt: { gte: startDate, lte: endDate },
    };

    // 1. 기간 내 요약 통계
    const totalCalls = await prisma.apiLog.count({ where: periodWhere });
    const successCalls = await prisma.apiLog.count({
      where: { ...periodWhere, statusCode: { lt: 400 } },
    });
    const avgDuration = await prisma.apiLog.aggregate({
      where: periodWhere,
      _avg: { durationMs: true },
    });

    // 2. 엔드포인트별 통계
    const byEndpoint = await prisma.apiLog.groupBy({
      by: ["endpoint", "method"],
      where: periodWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    // 3. 일별 통계
    const timeLogs = await prisma.apiLog.findMany({
      where: periodWhere,
      select: { createdAt: true, statusCode: true },
    });

    // 일별로 성공/실패 집계
    const timeCounts: Record<string, { success: number; error: number }> = {};
    timeLogs.forEach((log) => {
      const key = log.createdAt.toISOString().split("T")[0];

      if (!timeCounts[key]) {
        timeCounts[key] = { success: 0, error: 0 };
      }

      if (log.statusCode >= 200 && log.statusCode < 400) {
        timeCounts[key].success++;
      } else {
        timeCounts[key].error++;
      }
    });

    const byTime = Object.entries(timeCounts)
      .map(([time, counts]) => ({
        time,
        label: new Date(time).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        success: counts.success,
        error: counts.error,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    // 4. 상태 코드별 통계
    const byStatus = await prisma.apiLog.groupBy({
      by: ["statusCode"],
      where: periodWhere,
      _count: { id: true },
      orderBy: { statusCode: "asc" },
    });

    // 5. 개별 로그 목록 (최근 100개)
    const logs = await prisma.apiLog.findMany({
      where: periodWhere,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        endpoint: true,
        method: true,
        statusCode: true,
        durationMs: true,
        createdAt: true,
        metadata: true,
      },
    });

    return NextResponse.json({
      summary: {
        totalCalls,
        successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgDuration._avg.durationMs || 0),
      },
      byEndpoint: byEndpoint.map((e) => ({
        endpoint: e.endpoint,
        method: e.method,
        count: e._count.id,
      })),
      byTime,
      byStatus: byStatus.map((s) => ({
        statusCode: s.statusCode,
        count: s._count.id,
      })),
      logs: logs.map((l) => ({
        id: l.id,
        endpoint: l.endpoint,
        method: l.method,
        statusCode: l.statusCode,
        durationMs: l.durationMs,
        createdAt: l.createdAt.toISOString(),
        metadata: l.metadata as Record<string, unknown> | null,
      })),
    });
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      { message: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
