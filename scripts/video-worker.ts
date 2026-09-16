import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { claimVideoJob, executeVideoJob } = await import("../lib/video/queue");
  const { claimImageJob, executeImageJob } = await import("../lib/image/queue");
  const { claimObjectCleanupJob, executeObjectCleanupJob } = await import(
    "../lib/storage/cleanup-queue"
  );
  const { prisma } = await import("../lib/prisma");
  const { cleanupOrphanFiles, cleanupFailedFiles } = await import(
    "../lib/api/cleanup-orphans"
  );
  let stopping = false;
  process.on("SIGTERM", () => {
    stopping = true;
  });
  process.on("SIGINT", () => {
    stopping = true;
  });
  const configured = Number(
    process.env.MEDIA_WORKER_CONCURRENCY ??
      process.env.VIDEO_WORKER_CONCURRENCY ??
      2,
  );
  const concurrency = Number.isInteger(configured)
    ? Math.max(1, Math.min(8, configured))
    : 2;
  console.info(`Media worker started (concurrency=${concurrency})`);
  const queueRunners = [
    async () => {
      const job = await claimImageJob();
      if (!job) return false;
      await executeImageJob(job);
      return true;
    },
    async () => {
      const job = await claimVideoJob();
      if (!job) return false;
      await executeVideoJob(job);
      return true;
    },
    async () => {
      const job = await claimObjectCleanupJob();
      if (!job) return false;
      await executeObjectCleanupJob(job);
      return true;
    },
  ];
  let nextQueue = 0;
  let nextMaintenanceAt = 0;
  const loop = async () => {
    while (!stopping) {
      try {
        if (Date.now() >= nextMaintenanceAt) {
          nextMaintenanceAt = Date.now() + 5 * 60 * 1000;
          await cleanupOrphanFiles(30);
          await cleanupFailedFiles(7);
        }
        const start = nextQueue++ % queueRunners.length;
        let handled = false;
        for (let offset = 0; offset < queueRunners.length; offset += 1) {
          const runQueue =
            queueRunners[(start + offset) % queueRunners.length];
          if (await runQueue()) {
            handled = true;
            break;
          }
        }
        if (handled) continue;
      } catch {
        console.error("Media worker database operation failed; retrying");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };
  await Promise.all(Array.from({ length: concurrency }, loop));
  await prisma.$disconnect();
}
void main().catch(() => {
  console.error("Media worker startup failed");
  process.exitCode = 1;
});
