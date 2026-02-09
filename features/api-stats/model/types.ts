/**
 * API 통계 데이터 타입
 */

export interface ApiStatsSummary {
  totalCalls: number;
  successRate: number;
  avgResponseTime: number;
}

export interface EndpointStats {
  endpoint: string;
  method: string;
  count: number;
}

export interface TimeStats {
  time: string;
  label: string;
  success: number;
  error: number;
}

export interface StatusCodeStats {
  statusCode: number;
  count: number;
}

export interface MethodStats {
  method: string;
  count: number;
}

export interface LogEntry {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  createdAt: string;
  projectId?: string | null;
  metadata?: Record<string, unknown> | null; // 추가 정보 (파일명 등)
  authSource?: "ui" | "apiKey";
  apiKeyId?: string | null;
  apiKeyName?: string | null;
  apiKeyPrefix?: string | null;
}

export type ApiLogStatusFilter = "all" | "success" | "error";

export interface ApiStatsLogQuery {
  page?: number;
  pageSize?: number;
  status?: ApiLogStatusFilter;
  methods?: string[];
  method?: string;
  actors?: string[];
  search?: string;
  statusCodeClasses?: Array<"2xx" | "3xx" | "4xx" | "5xx">;
  latencyMinMs?: number;
  latencyMaxMs?: number;
  metadataKeyword?: string;
}

export interface ApiStatsLogsPage {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiStatsResponse {
  summary: ApiStatsSummary;
  byEndpoint: EndpointStats[];
  methodCounts: MethodStats[];
  byTime: TimeStats[];
  byStatus: StatusCodeStats[];
  logs: LogEntry[];
  logsPage?: ApiStatsLogsPage;
}
