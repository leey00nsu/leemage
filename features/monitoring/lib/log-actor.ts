type MonitoringLogLike = {
  endpoint: string;
  metadata?: Record<string, unknown> | null;
  authSource?: "ui" | "apiKey";
  apiKeyId?: string | null;
  apiKeyName?: string | null;
  apiKeyPrefix?: string | null;
};

export type MonitoringLogActorType = "ui" | "apiKey";

export interface MonitoringLogActor {
  type: MonitoringLogActorType;
  label: string;
  apiKeyId: string | null;
  filterValue: string;
}

interface ResolveMonitoringLogActorOptions {
  apiKeyNameById?: Record<string, string>;
  uiLabel?: string;
  unknownApiKeyLabel?: string;
}

function getStringValue(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!metadata) return null;
  return getStringValue(metadata[key]);
}

export function resolveMonitoringLogActor(
  log: MonitoringLogLike,
  options: ResolveMonitoringLogActorOptions = {},
): MonitoringLogActor {
  const metadata = log.metadata ?? null;
  const uiLabel = options.uiLabel ?? "UI";
  const unknownApiKeyLabel = options.unknownApiKeyLabel ?? "Unknown API Key";

  const sourceFromLog = log.authSource;
  const sourceFromMetadata = getMetadataString(metadata, "authSource")?.toLowerCase();
  const isApiKeySource =
    sourceFromLog === "apiKey" ||
    sourceFromMetadata === "apikey" ||
    sourceFromMetadata === "api_key" ||
    sourceFromMetadata === "api-key" ||
    log.endpoint.startsWith("/api/v1/");

  if (!isApiKeySource) {
    return {
      type: "ui",
      label: uiLabel,
      apiKeyId: null,
      filterValue: "ui",
    };
  }

  const apiKeyId = log.apiKeyId ?? getMetadataString(metadata, "apiKeyId");
  const apiKeyName = log.apiKeyName ?? getMetadataString(metadata, "apiKeyName");
  const apiKeyPrefix =
    log.apiKeyPrefix ?? getMetadataString(metadata, "apiKeyPrefix");
  const nameFromMap =
    apiKeyId && options.apiKeyNameById ? options.apiKeyNameById[apiKeyId] : null;

  const label = apiKeyName ?? nameFromMap ?? apiKeyPrefix ?? unknownApiKeyLabel;

  return {
    type: "apiKey",
    label,
    apiKeyId,
    filterValue: apiKeyId ? `apiKey:${apiKeyId}` : "apiKey:unknown",
  };
}
