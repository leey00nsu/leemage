import type { Prisma } from "@/lib/generated/prisma";

type GroupByEndpointRow = {
  endpoint: string;
  method: string;
  _count: { id: number };
};

type GroupByStatusRow = {
  statusCode: number;
  _count: { id: number };
};

type TimeLogRow = {
  createdAt: Date;
  statusCode: number;
};

type LogRow = {
  id: string;
  projectId: string | null;
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number | null;
  createdAt: Date;
  metadata: Prisma.JsonValue | null;
};

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  if (!metadata) return null;

  const value = metadata[key];
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function resolveAuthSource(
  metadata: Record<string, unknown> | null,
  endpoint: string,
): "ui" | "apiKey" {
  const rawSource = getMetadataString(metadata, "authSource")?.toLowerCase();

  if (rawSource === "apikey" || rawSource === "api_key" || rawSource === "api-key") {
    return "apiKey";
  }

  if (rawSource === "ui") {
    return "ui";
  }

  return endpoint.startsWith("/api/v1/") ? "apiKey" : "ui";
}

export function buildByTime(timeLogs: TimeLogRow[]) {
  const timeCounts: Record<string, { success: number; error: number }> = {};

  timeLogs.forEach((log) => {
    const key = log.createdAt.toISOString().split("T")[0];

    if (!timeCounts[key]) {
      timeCounts[key] = { success: 0, error: 0 };
    }

    if (log.statusCode >= 200 && log.statusCode < 400) {
      timeCounts[key].success += 1;
    } else {
      timeCounts[key].error += 1;
    }
  });

  return Object.entries(timeCounts)
    .map(([time, counts]) => ({
      time,
      label: new Date(time).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      success: counts.success,
      error: counts.error,
    }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function mapEndpointStats(byEndpoint: GroupByEndpointRow[]) {
  return byEndpoint.map((item) => ({
    endpoint: item.endpoint,
    method: item.method,
    count: item._count.id,
  }));
}

export function mapStatusStats(byStatus: GroupByStatusRow[]) {
  return byStatus.map((item) => ({
    statusCode: item.statusCode,
    count: item._count.id,
  }));
}

export function mapApiLogs(logs: LogRow[]) {
  return logs.map((log) => {
    const metadata =
      log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
        ? (log.metadata as Record<string, unknown>)
        : null;
    const authSource = resolveAuthSource(metadata, log.endpoint);

    return {
      id: log.id,
      projectId: log.projectId,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.statusCode,
      durationMs: log.durationMs,
      createdAt: log.createdAt.toISOString(),
      metadata,
      authSource,
      apiKeyId:
        authSource === "apiKey" ? getMetadataString(metadata, "apiKeyId") : null,
      apiKeyName:
        authSource === "apiKey" ? getMetadataString(metadata, "apiKeyName") : null,
      apiKeyPrefix:
        authSource === "apiKey" ? getMetadataString(metadata, "apiKeyPrefix") : null,
    };
  });
}
