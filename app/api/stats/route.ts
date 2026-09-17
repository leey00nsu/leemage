/**
 * API 사용 통계 조회 API
 * 사용자의 API 호출 통계를 제공합니다.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildStatsWhere } from "@/features/api-stats/server/log-filters";
import { parseStatsQueryParams } from "@/features/api-stats/server/query-params";
import { mapApiLogs } from "@/features/api-stats/server/response-mapper";
import { queryStatsAggregates } from "@/features/api-stats/server/stats-query";
import { AuthenticatedRequest, withSessionAuth } from "@/lib/auth/session-auth";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";

export const GET = withSessionAuth(async (request: AuthenticatedRequest) => {
  const userId = request.session.username!;
  const params = parseStatsQueryParams(request);

  try {
    const { logsWhere } = buildStatsWhere({
      userId,
      params,
    });

    const [aggregates, logs] = await Promise.all([
      queryStatsAggregates(userId, params),
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
    const totalFilteredLogs = aggregates.totalCalls;

    const totalPages = Math.max(
      1,
      Math.ceil(totalFilteredLogs / params.logPageSize),
    );

    return NextResponse.json({
      summary: {
        totalCalls: aggregates.totalCalls,
        successRate:
          aggregates.totalCalls > 0
            ? (aggregates.successCalls / aggregates.totalCalls) * 100
            : 0,
        avgResponseTime: aggregates.avgDuration,
      },
      byEndpoint: aggregates.byEndpoint,
      methodCounts: aggregates.methodCounts,
      byTime: aggregates.byTime,
      byStatus: aggregates.byStatus,
      logsPage: {
        page: params.logPage,
        pageSize: params.logPageSize,
        total: totalFilteredLogs,
        totalPages,
      },
      logs: mapApiLogs(logs),
    });
  } catch (error) {
    apiLogger.error("stats.fetch.failed", getSafeErrorMetadata(error));
    return NextResponse.json(
      { message: "An error occurred while retrieving statistics." },
      { status: 500 },
    );
  }
});
