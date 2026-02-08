import { Prisma } from "@/lib/generated/prisma";
import {
  STATUS_CODE_CLASS_TO_RANGE,
  type StatsQueryParams,
} from "@/features/api-stats/server/query-params";

interface BuildLogFiltersInput {
  userId: string;
  params: StatsQueryParams;
}

export interface StatsWhere {
  periodWhere: Prisma.ApiLogWhereInput;
  logsWhere: Prisma.ApiLogWhereInput;
}

function buildStatusFilter(logStatus: string | null): Prisma.ApiLogWhereInput | null {
  if (logStatus === "success") {
    return { statusCode: { gte: 200, lt: 400 } };
  }

  if (logStatus === "error") {
    return {
      OR: [{ statusCode: { lt: 200 } }, { statusCode: { gte: 400 } }],
    };
  }

  return null;
}

function buildMethodFilter(logMethod: string | null): Prisma.ApiLogWhereInput | null {
  if (!logMethod || logMethod === "all") {
    return null;
  }

  return { method: logMethod.toUpperCase() };
}

function buildSearchFilter(logSearch: string): Prisma.ApiLogWhereInput | null {
  if (!logSearch) {
    return null;
  }

  return {
    endpoint: { contains: logSearch, mode: "insensitive" },
  };
}

function buildStatusCodeClassFilter(
  logStatusCodeClasses: StatsQueryParams["logStatusCodeClasses"],
): Prisma.ApiLogWhereInput | null {
  if (logStatusCodeClasses.length === 0) {
    return null;
  }

  return {
    OR: logStatusCodeClasses.map((statusCodeClass) => ({
      statusCode: STATUS_CODE_CLASS_TO_RANGE[statusCodeClass],
    })),
  };
}

function buildLatencyFilter(
  minRaw: string | null,
  maxRaw: string | null,
): Prisma.ApiLogWhereInput | null {
  const latencyMin = minRaw !== null ? Number(minRaw) : undefined;
  const latencyMax = maxRaw !== null ? Number(maxRaw) : undefined;
  const latencyFilter: Prisma.IntNullableFilter<"ApiLog"> = {};

  if (typeof latencyMin === "number" && Number.isFinite(latencyMin)) {
    latencyFilter.gte = Math.max(0, Math.floor(latencyMin));
  }

  if (typeof latencyMax === "number" && Number.isFinite(latencyMax)) {
    latencyFilter.lte = Math.max(0, Math.floor(latencyMax));
  }

  if (Object.keys(latencyFilter).length === 0) {
    return null;
  }

  return { durationMs: latencyFilter };
}

function buildMetadataFilter(logMetadataKeyword: string): Prisma.ApiLogWhereInput | null {
  if (!logMetadataKeyword) {
    return null;
  }

  return {
    metadata: {
      string_contains: logMetadataKeyword,
      mode: "insensitive",
    },
  };
}

function buildSingleActorFilter(logActor: string): Prisma.ApiLogWhereInput | null {
  if (logActor === "ui") {
    return {
      OR: [
        { metadata: { path: ["authSource"], equals: "ui" } },
        {
          AND: [
            { endpoint: { not: { startsWith: "/api/v1/" } } },
            { NOT: { metadata: { path: ["authSource"], equals: "apiKey" } } },
          ],
        },
      ],
    };
  }

  if (!logActor?.startsWith("apiKey:")) {
    return null;
  }

  const apiKeyId = logActor.slice("apiKey:".length).trim();
  if (apiKeyId === "unknown") {
    return {
      AND: [
        {
          OR: [
            { metadata: { path: ["authSource"], equals: "apiKey" } },
            { endpoint: { startsWith: "/api/v1/" } },
          ],
        },
        {
          NOT: {
            metadata: { path: ["apiKeyId"], string_contains: "" },
          },
        },
      ],
    };
  }

  if (!apiKeyId) {
    return null;
  }

  return { metadata: { path: ["apiKeyId"], equals: apiKeyId } };
}

function buildActorFilter(logActors: string[]): Prisma.ApiLogWhereInput | null {
  if (logActors.length === 0) {
    return null;
  }

  const conditions = logActors
    .map((actor) => buildSingleActorFilter(actor))
    .filter((condition): condition is Prisma.ApiLogWhereInput => Boolean(condition));

  if (conditions.length === 0) {
    return null;
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { OR: conditions };
}

export function buildStatsWhere({ userId, params }: BuildLogFiltersInput): StatsWhere {
  const baseWhere: Prisma.ApiLogWhereInput = {
    userId,
    ...(params.projectIds.length > 0 ? { projectId: { in: params.projectIds } } : {}),
  };

  const periodWhere: Prisma.ApiLogWhereInput = {
    ...baseWhere,
    createdAt: { gte: params.startDate, lte: params.endDate },
  };

  const logWhereAnd: Prisma.ApiLogWhereInput[] = [
    buildStatusFilter(params.logStatus),
    buildMethodFilter(params.logMethod),
    buildSearchFilter(params.logSearch),
    buildStatusCodeClassFilter(params.logStatusCodeClasses),
    buildLatencyFilter(params.logLatencyMinMsRaw, params.logLatencyMaxMsRaw),
    buildMetadataFilter(params.logMetadataKeyword),
    buildActorFilter(params.logActors),
  ].filter((filter): filter is Prisma.ApiLogWhereInput => Boolean(filter));

  return {
    periodWhere,
    logsWhere: logWhereAnd.length > 0 ? { ...periodWhere, AND: logWhereAnd } : periodWhere,
  };
}
