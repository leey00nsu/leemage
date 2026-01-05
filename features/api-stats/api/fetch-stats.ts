/**
 * API 통계 데이터 fetching API
 */

import { ApiStatsResponse } from "../model/types";

export async function fetchApiStats(
  projectId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<ApiStatsResponse> {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (startDate) params.set("startDate", startDate.toISOString());
  if (endDate) params.set("endDate", endDate.toISOString());

  const url = `/api/stats?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API 통계를 불러오는데 실패했습니다.");
  }

  return response.json();
}
