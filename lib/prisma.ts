import { PrismaClient } from "./generated/prisma";
import { buildDatabaseUrl } from "./database-url";
import { observeDependency } from "./observability/metrics";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = buildDatabaseUrl(process.env.DATABASE_URL);

function createPrismaClient() {
  const client = new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    transactionOptions: {
      maxWait: 5_000,
      timeout: 15_000,
    },
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
    ],
  });
  client.$on("query", (event) => {
    observeDependency({
      dependency: "database",
      operation: "query",
      durationMs: event.duration,
      success: true,
    });
  });
  client.$on("error", () => {
    observeDependency({
      dependency: "database",
      operation: "query",
      durationMs: 0,
      success: false,
    });
  });
  return client;
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
