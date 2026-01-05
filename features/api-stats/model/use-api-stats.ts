/**
 * API 통계 데이터 React Query Hook
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchApiStats } from "../api/fetch-stats";

export function useApiStats(
  projectId?: string,
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: [
      "api-stats",
      projectId,
      startDate?.toISOString(),
      endDate?.toISOString(),
    ],
    queryFn: () => fetchApiStats(projectId, startDate, endDate),
    staleTime: 1000 * 60, // 1분간 캐시
  });
}
