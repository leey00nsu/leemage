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

export interface LogEntry {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null; // 추가 정보 (파일명 등)
}

export interface ApiStatsResponse {
  summary: ApiStatsSummary;
  byEndpoint: EndpointStats[];
  byTime: TimeStats[];
  byStatus: StatusCodeStats[];
  logs: LogEntry[];
}
