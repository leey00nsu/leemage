/**
 * API 통계 데이터 fetching API
 */

import { ApiStatsResponse } from "../model/types";
import type { ApiStatsLogQuery } from "../model/types";

export async function fetchApiStats(
  projectId?: string,
  startDate?: Date,
  endDate?: Date,
  logQuery?: ApiStatsLogQuery,
): Promise<ApiStatsResponse> {
  const params = new URLSearchParams();
  if (projectId) params.set("projectId", projectId);
  if (startDate) params.set("startDate", startDate.toISOString());
  if (endDate) params.set("endDate", endDate.toISOString());
  if (typeof logQuery?.page === "number") {
    params.set("logPage", String(logQuery.page));
  }
  if (typeof logQuery?.pageSize === "number") {
    params.set("logPageSize", String(logQuery.pageSize));
  }
  if (logQuery?.status && logQuery.status !== "all") {
    params.set("logStatus", logQuery.status);
  }
  if (logQuery?.method && logQuery.method !== "all") {
    params.set("logMethod", logQuery.method);
  }
  if (logQuery?.actor && logQuery.actor !== "all") {
    params.set("logActor", logQuery.actor);
  }
  if (logQuery?.search?.trim()) {
    params.set("logSearch", logQuery.search.trim());
  }
  if (logQuery?.statusCodeClasses?.length) {
    params.set("logStatusCodeClasses", logQuery.statusCodeClasses.join(","));
  }
  if (typeof logQuery?.latencyMinMs === "number") {
    params.set("logLatencyMinMs", String(logQuery.latencyMinMs));
  }
  if (typeof logQuery?.latencyMaxMs === "number") {
    params.set("logLatencyMaxMs", String(logQuery.latencyMaxMs));
  }
  if (logQuery?.metadataKeyword?.trim()) {
    params.set("logMetadataKeyword", logQuery.metadataKeyword.trim());
  }

  const url = `/api/stats?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("API 통계를 불러오는데 실패했습니다.");
  }

  return response.json();
}
