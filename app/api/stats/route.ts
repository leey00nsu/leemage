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
  mapMethodStats,
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
    const { logsWhere, methodAvailabilityWhere } = buildStatsWhere({
      userId,
      params,
    });

    const [
      totalCalls,
      successCalls,
      avgDuration,
      byEndpoint,
      byMethod,
      timeLogs,
      byStatus,
      logs,
    ] = await Promise.all([
      prisma.apiLog.count({ where: logsWhere }),
      prisma.apiLog.count({
        where: { ...logsWhere, statusCode: { lt: 400 } },
      }),
      prisma.apiLog.aggregate({
        where: logsWhere,
        _avg: { durationMs: true },
      }),
      prisma.apiLog.groupBy({
        by: ["endpoint", "method"],
        where: logsWhere,
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.apiLog.groupBy({
        by: ["method"],
        where: methodAvailabilityWhere,
        _count: { id: true },
      }),
      prisma.apiLog.findMany({
        where: logsWhere,
        select: { createdAt: true, statusCode: true },
      }),
      prisma.apiLog.groupBy({
        by: ["statusCode"],
        where: logsWhere,
        _count: { id: true },
        orderBy: { statusCode: "asc" },
      }),
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
    const totalFilteredLogs = totalCalls;

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
      methodCounts: mapMethodStats(byMethod),
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
