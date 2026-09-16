import { randomUUID } from "node:crypto";
import { Prisma, type ObjectCleanupJob, type StorageProvider } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage/factory";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";

const MAX_ATTEMPTS = 5;

type CleanupTarget =
  | { fileId: string; projectId: string }
  | { projectId: string }
  | { fileIds: string[] };

/**
 * Writes the storage deletion outbox in the same transaction that removes DB
 * ownership. Source objects wait until their upload URL has certainly expired.
 */
export async function enqueueOwnedObjects(
  tx: Prisma.TransactionClient,
  target: CleanupTarget,
) {
  const condition =
    "fileId" in target
      ? Prisma.sql`"File".id = ${target.fileId} AND "File"."projectId" = ${target.projectId}`
      : "fileIds" in target
        ? Prisma.sql`"File".id IN (${Prisma.join(target.fileIds)})`
      : Prisma.sql`"File"."projectId" = ${target.projectId}`;

  await tx.$executeRaw(Prisma.sql`
    WITH raw_objects AS (
      SELECT
        "Project"."storageProvider" AS provider,
        "File"."objectName" AS "objectName",
        GREATEST(NOW(), "File"."createdAt" + INTERVAL '20 minutes') AS "availableAt"
      FROM "File"
      INNER JOIN "Project" ON "Project".id = "File"."projectId"
      WHERE ${condition} AND "File"."objectName" IS NOT NULL

      UNION ALL

      SELECT
        "Project"."storageProvider" AS provider,
        "File"."projectId" || '/' || regexp_replace(
          split_part(variant.value->>'url', '?', 1), '^.*/', ''
        ) AS "objectName",
        NOW() AS "availableAt"
      FROM "File"
      INNER JOIN "Project" ON "Project".id = "File"."projectId"
      CROSS JOIN LATERAL jsonb_array_elements("File".variants::jsonb) variant(value)
      WHERE ${condition}
        AND variant.value->>'url' ~ '^https?://.+/[^/]+$'
    ), objects AS (
      SELECT provider, "objectName", MAX("availableAt") AS "availableAt"
      FROM raw_objects
      WHERE "objectName" IS NOT NULL AND "objectName" <> ''
      GROUP BY provider, "objectName"
    )
    INSERT INTO "ObjectCleanupJob" (
      provider, "objectName", status, attempts, "availableAt", "createdAt", "updatedAt"
    )
    SELECT provider, "objectName", 'QUEUED', 0, "availableAt", NOW(), NOW()
    FROM objects
    ON CONFLICT (provider, "objectName") DO UPDATE SET
      status = CASE
        WHEN "ObjectCleanupJob".status = 'FAILED' THEN 'QUEUED'
        ELSE "ObjectCleanupJob".status
      END,
      attempts = CASE
        WHEN "ObjectCleanupJob".status = 'FAILED' THEN 0
        ELSE "ObjectCleanupJob".attempts
      END,
      "availableAt" = LEAST("ObjectCleanupJob"."availableAt", EXCLUDED."availableAt"),
      "updatedAt" = NOW()
  `);
}

export async function enqueueStorageObjects(
  provider: StorageProvider,
  objectNames: string[],
) {
  const names = [...new Set(objectNames.filter(Boolean))];
  if (names.length === 0) return;
  await prisma.$transaction(
    names.map((objectName) =>
      prisma.objectCleanupJob.upsert({
        where: { provider_objectName: { provider, objectName } },
        create: { provider, objectName },
        update: {
          status: "QUEUED",
          attempts: 0,
          availableAt: new Date(),
          leaseUntil: null,
          leaseToken: null,
          lastError: null,
        },
      }),
    ),
  );
}

export async function claimObjectCleanupJob(): Promise<ObjectCleanupJob | null> {
  await prisma.objectCleanupJob.updateMany({
    where: {
      status: "RUNNING",
      attempts: { gte: MAX_ATTEMPTS },
      leaseUntil: { lt: new Date() },
    },
    data: {
      status: "FAILED",
      leaseUntil: null,
      leaseToken: null,
      lastError: "WORKER_LEASE_EXPIRED",
    },
  });
  const jobs = await prisma.$queryRaw<ObjectCleanupJob[]>`
    WITH candidate AS (
      SELECT provider, "objectName" FROM "ObjectCleanupJob"
      WHERE attempts < ${MAX_ATTEMPTS} AND (
        (status = 'QUEUED' AND "availableAt" <= NOW())
        OR (status = 'RUNNING' AND "leaseUntil" < NOW())
      )
      ORDER BY "availableAt" ASC
      FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE "ObjectCleanupJob" job
    SET status = 'RUNNING', attempts = job.attempts + 1,
      "leaseToken" = ${randomUUID()},
      "leaseUntil" = NOW() + INTERVAL '5 minutes',
      "updatedAt" = NOW()
    FROM candidate
    WHERE job.provider = candidate.provider
      AND job."objectName" = candidate."objectName"
    RETURNING job.*
  `;
  return jobs[0] ?? null;
}

export async function executeObjectCleanupJob(job: ObjectCleanupJob) {
  const ownership = {
    provider: job.provider,
    objectName: job.objectName,
    status: "RUNNING",
    leaseToken: job.leaseToken,
  };
  try {
    const adapter = await StorageFactory.getAdapter(
      fromPrismaStorageProvider(job.provider),
    );
    await adapter.deleteObject(job.objectName);
    await prisma.objectCleanupJob.deleteMany({ where: ownership });
  } catch {
    const terminal = job.attempts >= MAX_ATTEMPTS;
    await prisma.objectCleanupJob.updateMany({
      where: ownership,
      data: {
        status: terminal ? "FAILED" : "QUEUED",
        availableAt: new Date(
          Date.now() + Math.min(300_000, 5_000 * 2 ** (job.attempts - 1)),
        ),
        leaseUntil: null,
        leaseToken: null,
        lastError: "OBJECT_DELETE_FAILED",
      },
    });
  }
}
