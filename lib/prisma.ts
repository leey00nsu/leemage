import { PrismaClient } from "./generated/prisma";
import { buildDatabaseUrl } from "./database-url";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const databaseUrl = buildDatabaseUrl(process.env.DATABASE_URL);

export const prisma = global.prisma || new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  transactionOptions: {
    maxWait: 5_000,
    timeout: 15_000,
  },
});

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
