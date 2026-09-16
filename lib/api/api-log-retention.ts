import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

function retentionDays() {
  const configured = Number(process.env.API_LOG_RETENTION_DAYS ?? 90);
  return Number.isInteger(configured)
    ? Math.max(7, Math.min(3_650, configured))
    : 90;
}

/** Deletes bounded batches so retention never holds a long-running table lock. */
export async function cleanupExpiredApiLogs(maxBatches = 5) {
  const cutoff = new Date(
    Date.now() - retentionDays() * 24 * 60 * 60 * 1_000,
  );
  let deleted = 0;

  for (let batch = 0; batch < maxBatches; batch += 1) {
    const count = await prisma.$executeRaw(Prisma.sql`
      WITH maintenance_lock AS (
        SELECT pg_try_advisory_xact_lock(hashtext('maintenance:api-log-retention')) AS locked
      ), victims AS MATERIALIZED (
        SELECT id FROM "ApiLog"
        WHERE "createdAt" < ${cutoff}
          AND (SELECT locked FROM maintenance_lock)
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 5000
      )
      DELETE FROM "ApiLog"
      WHERE id IN (SELECT id FROM victims)
    `);
    deleted += count;
    if (count < 5_000) break;
  }

  return deleted;
}
