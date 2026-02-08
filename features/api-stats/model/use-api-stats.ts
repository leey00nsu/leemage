/**
 * API 통계 데이터 React Query Hook
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApiStats } from "../api/fetch-stats";
import type { ApiStatsLogQuery } from "./types";

export function useApiStats(
  projectIds?: string | string[],
  startDate?: Date,
  endDate?: Date,
  logQuery?: ApiStatsLogQuery,
) {
  const normalizedProjectIds = Array.isArray(projectIds)
    ? projectIds
    : projectIds
      ? [projectIds]
      : [];
  const serializedProjectIds =
    normalizedProjectIds.length > 0 ? JSON.stringify(normalizedProjectIds) : "";
  const serializedLogQuery = logQuery ? JSON.stringify(logQuery) : "";

  return useQuery({
    queryKey: [
      "api-stats",
      serializedProjectIds,
      startDate?.toISOString(),
      endDate?.toISOString(),
      serializedLogQuery,
    ],
    queryFn: () => fetchApiStats(normalizedProjectIds, startDate, endDate, logQuery),
    staleTime: 1000 * 60, // 1분간 캐시
  });
}
