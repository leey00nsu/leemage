/**
 * API 사용 통계 조회 API
 * 사용자의 API 호출 통계를 제공합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionDefault } from "@/lib/session";
import { buildStatsWhere } from "@/features/api-stats/server/log-filters";
import { parseStatsQueryParams } from "@/features/api-stats/server/query-params";
import {
  buildByTime,
  mapApiLogs,
  mapEndpointStats,
  mapStatusStats,
} from "@/features/api-stats/server/response-mapper";

export async function GET(request: NextRequest) {
  const session = await getSessionDefault();

  if (!session?.username) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const userId = session.username;
  const params = parseStatsQueryParams(request);

  try {
    const { periodWhere, logsWhere } = buildStatsWhere({ userId, params });

    const [
      totalCalls,
      successCalls,
      avgDuration,
      byEndpoint,
      timeLogs,
      byStatus,
      totalFilteredLogs,
      logs,
    ] = await Promise.all([
      prisma.apiLog.count({ where: periodWhere }),
      prisma.apiLog.count({
        where: { ...periodWhere, statusCode: { lt: 400 } },
      }),
      prisma.apiLog.aggregate({
        where: periodWhere,
        _avg: { durationMs: true },
      }),
      prisma.apiLog.groupBy({
        by: ["endpoint", "method"],
        where: periodWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.apiLog.findMany({
        where: periodWhere,
        select: { createdAt: true, statusCode: true },
      }),
      prisma.apiLog.groupBy({
        by: ["statusCode"],
        where: periodWhere,
        _count: { id: true },
        orderBy: { statusCode: "asc" },
      }),
      prisma.apiLog.count({ where: logsWhere }),
      prisma.apiLog.findMany({
        where: logsWhere,
        orderBy: { createdAt: "desc" },
        skip: (params.logPage - 1) * params.logPageSize,
        take: params.logPageSize,
        select: {
          id: true,
          projectId: true,
          endpoint: true,
          method: true,
          statusCode: true,
          durationMs: true,
          createdAt: true,
          metadata: true,
        },
      }),
    ]);

    const totalPages = Math.max(
      1,
      Math.ceil(totalFilteredLogs / params.logPageSize),
    );

    return NextResponse.json({
      summary: {
        totalCalls,
        successRate: totalCalls > 0 ? (successCalls / totalCalls) * 100 : 0,
        avgResponseTime: Math.round(avgDuration._avg.durationMs || 0),
      },
      byEndpoint: mapEndpointStats(byEndpoint),
      byTime: buildByTime(timeLogs),
      byStatus: mapStatusStats(byStatus),
      logsPage: {
        page: params.logPage,
        pageSize: params.logPageSize,
        total: totalFilteredLogs,
        totalPages,
      },
      logs: mapApiLogs(logs),
    });
  } catch (error) {
    console.error("통계 조회 오류:", error);
    return NextResponse.json(
      { message: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
