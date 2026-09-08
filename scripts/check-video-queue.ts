/** Isolated PostgreSQL smoke test. Never claims jobs in the application's schema. */
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import assert from "node:assert/strict";
import { PrismaClient } from "../lib/generated/prisma";

async function main() {
  const schema = `video_queue_test_${Date.now()}`;
  const admin = new PrismaClient();
  const url = new URL(process.env.DATABASE_URL!);
  url.searchParams.set("schema", schema);
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    for (const table of ["Project", "File", "VideoJob"])
      await admin.$executeRawUnsafe(
        `CREATE TABLE "${schema}"."${table}" (LIKE public."${table}" INCLUDING ALL)`,
      );
    await admin.$executeRawUnsafe(
      `CREATE TYPE "${schema}"."StorageProvider" AS ENUM ('OCI', 'R2')`,
    );
    await admin.$executeRawUnsafe(
      `CREATE TYPE "${schema}"."FileStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED')`,
    );
    for (const [table, column, type, initial] of [
      ["Project", "storageProvider", "StorageProvider", "OCI"],
      ["File", "status", "FileStatus", "COMPLETED"],
    ]) {
      await admin.$executeRawUnsafe(
        `ALTER TABLE "${schema}"."${table}" ALTER COLUMN "${column}" DROP DEFAULT`,
      );
      await admin.$executeRawUnsafe(
        `ALTER TABLE "${schema}"."${table}" ALTER COLUMN "${column}" TYPE "${schema}"."${type}" USING "${column}"::text::"${schema}"."${type}"`,
      );
      await admin.$executeRawUnsafe(
        `ALTER TABLE "${schema}"."${table}" ALTER COLUMN "${column}" SET DEFAULT '${initial}'::"${schema}"."${type}"`,
      );
    }
    global.prisma = db;
    const { claimVideoJob } = await import("../lib/video/queue");
    await db.project.create({
      data: {
        id: "test-project",
        name: "Queue test",
        userId: "test-owner",
        storageProvider: "R2",
      },
    });
    for (let index = 0; index < 4; index++) {
      await db.file.create({
        data: {
          id: `test-${index}`,
          projectId: "test-project",
          name: "video.mp4",
          mimeType: "video/mp4",
          size: 1,
          isImage: false,
          status: "COMPLETED",
          variants: [],
        },
      });
      await db.videoJob.create({ data: { id: `test-${index}` } });
    }
    const claims = await Promise.all(
      Array.from({ length: 6 }, () => claimVideoJob()),
    );
    assert.equal(claims.filter(Boolean).length, 4);
    assert.equal(new Set(claims.filter(Boolean).map((job) => job!.id)).size, 4);
    const first = claims.find(Boolean)!;
    await db.videoJob.update({
      where: { id: first.id },
      data: { leaseUntil: new Date(0) },
    });
    const recovered = await claimVideoJob();
    assert.equal(recovered?.id, first.id);
    assert.equal(recovered?.attempts, 2);
    assert.notEqual(recovered?.leaseToken, first.leaseToken);
    const late = await db.videoJob.updateMany({
      where: { id: first.id, leaseToken: first.leaseToken },
      data: { status: "DONE" },
    });
    assert.equal(late.count, 0);
    await db.videoJob.update({
      where: { id: first.id },
      data: { attempts: 3, leaseUntil: new Date(0) },
    });
    assert.equal(await claimVideoJob(), null);
    assert.equal(
      (await db.file.findUniqueOrThrow({ where: { id: first.id } }))
        .processingStatus,
      "FAILED",
    );
    console.info(
      "PASS: concurrent claims, crash recovery, stale-worker fencing, terminal expired lease (isolated schema)",
    );
  } finally {
    await db.$disconnect();
    await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await admin.$disconnect();
  }
}
void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Queue test failed");
  process.exitCode = 1;
});
