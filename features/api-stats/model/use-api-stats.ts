/**
 * API 통계 데이터 React Query Hook
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApiStats } from "../api/fetch-stats";
import type { ApiStatsLogQuery } from "./types";

export function useApiStats(
  projectId?: string,
  startDate?: Date,
  endDate?: Date,
  logQuery?: ApiStatsLogQuery,
) {
  const serializedLogQuery = logQuery ? JSON.stringify(logQuery) : "";

  return useQuery({
    queryKey: [
      "api-stats",
      projectId,
      startDate?.toISOString(),
      endDate?.toISOString(),
      serializedLogQuery,
    ],
    queryFn: () => fetchApiStats(projectId, startDate, endDate, logQuery),
    staleTime: 1000 * 60, // 1분간 캐시
  });
}
