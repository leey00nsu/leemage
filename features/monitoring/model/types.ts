export interface MonitoringLogDetail {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
  projectId?: string | null;
}

