const DEFAULTS = {
  connection_limit: { env: "DB_CONNECTION_LIMIT", value: 5, max: 50 },
  pool_timeout: { env: "DB_POOL_TIMEOUT_SECONDS", value: 10, max: 60 },
  connect_timeout: { env: "DB_CONNECT_TIMEOUT_SECONDS", value: 5, max: 60 },
  socket_timeout: { env: "DB_SOCKET_TIMEOUT_SECONDS", value: 30, max: 300 },
} as const;

function boundedInteger(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, max)
    : fallback;
}

/** Add conservative PostgreSQL pool and network limits without overriding URL options. */
export function buildDatabaseUrl(
  databaseUrl: string | undefined,
  env: Record<string, string | undefined> = process.env,
): string | undefined {
  if (!databaseUrl) return undefined;

  const url = new URL(databaseUrl);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return databaseUrl;
  }

  for (const [parameter, config] of Object.entries(DEFAULTS)) {
    if (!url.searchParams.has(parameter)) {
      url.searchParams.set(
        parameter,
        String(boundedInteger(env[config.env], config.value, config.max)),
      );
    }
  }

  return url.toString();
}
