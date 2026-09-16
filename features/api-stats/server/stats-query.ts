import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { buildStatsSqlWhere } from "./log-filters";
import type { StatsQueryParams } from "./query-params";

export interface StatsAggregateResult {
  totalCalls: number;
  successCalls: number;
  avgDuration: number;
  byEndpoint: Array<{ endpoint: string; method: string; count: number }>;
  methodCounts: Array<{ method: string; count: number }>;
  byTime: Array<{
    time: string;
    label: string;
    success: number;
    error: number;
  }>;
  byStatus: Array<{ statusCode: number; count: number }>;
}

type AggregateRow = {
  totalCalls: number;
  successCalls: number;
  avgDuration: number | null;
  byEndpoint: Array<{ endpoint: string; method: string; count: number }>;
  methodCounts: Array<{ method: string; count: number }>;
  byTime: Array<{ time: string; success: number; error: number }>;
  byStatus: Array<{ statusCode: number; count: number }>;
};

const emptyJsonArray = Prisma.sql`'[]'::jsonb`;

export async function queryStatsAggregates(
  userId: string,
  params: StatsQueryParams,
): Promise<StatsAggregateResult> {
  const fullWhere = buildStatsSqlWhere({ userId, params });
  const methodWhere = buildStatsSqlWhere({ userId, params }, false);
  const rows = await prisma.$queryRaw<AggregateRow[]>(Prisma.sql`
    WITH filtered AS MATERIALIZED (
      SELECT endpoint, method, "statusCode", "durationMs", "createdAt"
      FROM "ApiLog"
      WHERE ${fullWhere}
    ), method_filtered AS MATERIALIZED (
      SELECT method FROM "ApiLog" WHERE ${methodWhere}
    )
    SELECT
      COUNT(*)::int AS "totalCalls",
      COUNT(*) FILTER (WHERE "statusCode" < 400)::int AS "successCalls",
      COALESCE(AVG("durationMs"), 0)::float8 AS "avgDuration",
      COALESCE((
        SELECT jsonb_agg(row_data ORDER BY count DESC)
        FROM (
          SELECT endpoint, method, COUNT(*)::int AS count
          FROM filtered GROUP BY endpoint, method
          ORDER BY count DESC LIMIT 10
        ) row_data
      ), ${emptyJsonArray}) AS "byEndpoint",
      COALESCE((
        SELECT jsonb_agg(row_data ORDER BY method)
        FROM (
          SELECT method, COUNT(*)::int AS count
          FROM method_filtered GROUP BY method
        ) row_data
      ), ${emptyJsonArray}) AS "methodCounts",
      COALESCE((
        SELECT jsonb_agg(row_data ORDER BY time)
        FROM (
          SELECT
            to_char(date_trunc('day', "createdAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS time,
            COUNT(*) FILTER (WHERE "statusCode" >= 200 AND "statusCode" < 400)::int AS success,
            COUNT(*) FILTER (WHERE "statusCode" < 200 OR "statusCode" >= 400)::int AS error
          FROM filtered GROUP BY 1
        ) row_data
      ), ${emptyJsonArray}) AS "byTime",
      COALESCE((
        SELECT jsonb_agg(row_data ORDER BY "statusCode")
        FROM (
          SELECT "statusCode", COUNT(*)::int AS count
          FROM filtered GROUP BY "statusCode"
        ) row_data
      ), ${emptyJsonArray}) AS "byStatus"
    FROM filtered
  `);

  const row = rows[0];
  const byTime = (row?.byTime ?? []).map((item) => ({
    ...item,
    label: new Date(`${item.time}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
  }));

  return {
    totalCalls: Number(row?.totalCalls ?? 0),
    successCalls: Number(row?.successCalls ?? 0),
    avgDuration: Math.round(Number(row?.avgDuration ?? 0)),
    byEndpoint: row?.byEndpoint ?? [],
    methodCounts: row?.methodCounts ?? [],
    byTime,
    byStatus: row?.byStatus ?? [],
  };
}
