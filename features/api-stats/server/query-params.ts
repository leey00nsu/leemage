import type { NextRequest } from "next/server";

export const STATUS_CODE_CLASS_TO_RANGE = {
  "2xx": { gte: 200, lte: 299 },
  "3xx": { gte: 300, lte: 399 },
  "4xx": { gte: 400, lte: 499 },
  "5xx": { gte: 500, lte: 599 },
} as const;

export type StatusCodeClass = keyof typeof STATUS_CODE_CLASS_TO_RANGE;

export interface StatsQueryParams {
  projectIds: string[];
  startDate: Date;
  endDate: Date;
  logPage: number;
  logPageSize: number;
  logStatus: string | null;
  logMethods: string[];
  logActors: string[];
  logSearch: string;
  logStatusCodeClasses: StatusCodeClass[];
  logLatencyMinMsRaw: string | null;
  logLatencyMaxMsRaw: string | null;
  logMetadataKeyword: string;
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"]);

function parseListParam(value: string | null): string[] {
  if (!value) return [];

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return Array.from(new Set(parsed));
}

function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number,
): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}

function parseStatusCodeClasses(value: string | null): StatusCodeClass[] {
  if (!value) return [];

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is StatusCodeClass => item in STATUS_CODE_CLASS_TO_RANGE);

  return Array.from(new Set(parsed));
}

function parseMethods(
  methodsParam: string | null,
  legacyMethodParam: string | null,
): string[] {
  const methods = parseListParam(methodsParam);
  const rawMethods = methods.length > 0 ? methods : parseListParam(legacyMethodParam);

  return Array.from(
    new Set(
      rawMethods
        .map((method) => method.toUpperCase())
        .filter((method) => ALLOWED_METHODS.has(method)),
    ),
  );
}

function parseDateRange(
  startDateParam: string | null,
  endDateParam: string | null,
): { startDate: Date; endDate: Date } {
  const now = new Date();

  const startDate = startDateParam
    ? new Date(startDateParam)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = endDateParam
    ? new Date(endDateParam)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  return { startDate, endDate };
}

export function parseStatsQueryParams(request: NextRequest): StatsQueryParams {
  const { searchParams } = new URL(request.url);
  const { startDate, endDate } = parseDateRange(
    searchParams.get("startDate"),
    searchParams.get("endDate"),
  );
  const projectIds = parseListParam(searchParams.get("projectIds"));
  const logActors = parseListParam(searchParams.get("logActors"));

  return {
    projectIds:
      projectIds.length > 0
        ? projectIds
        : parseListParam(searchParams.get("projectId")),
    startDate,
    endDate,
    logPage: parsePositiveInt(searchParams.get("logPage"), 1, 100_000),
    logPageSize: parsePositiveInt(searchParams.get("logPageSize"), 100, 200),
    logStatus: searchParams.get("logStatus"),
    logMethods: parseMethods(
      searchParams.get("logMethods"),
      searchParams.get("logMethod"),
    ),
    logActors:
      logActors.length > 0
        ? logActors
        : parseListParam(searchParams.get("logActor")),
    logSearch: searchParams.get("logSearch")?.trim() ?? "",
    logStatusCodeClasses: parseStatusCodeClasses(
      searchParams.get("logStatusCodeClasses"),
    ),
    logLatencyMinMsRaw: searchParams.get("logLatencyMinMs"),
    logLatencyMaxMsRaw: searchParams.get("logLatencyMaxMs"),
    logMetadataKeyword: searchParams.get("logMetadataKeyword")?.trim() ?? "",
  };
}
