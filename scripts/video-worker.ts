import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { claimVideoJob, executeVideoJob } = await import("../lib/video/queue");
  const { prisma } = await import("../lib/prisma");
  let stopping = false;
  process.on("SIGTERM", () => {
    stopping = true;
  });
  process.on("SIGINT", () => {
    stopping = true;
  });
  const configured = Number(process.env.VIDEO_WORKER_CONCURRENCY ?? 2);
  const concurrency = Number.isInteger(configured)
    ? Math.max(1, Math.min(8, configured))
    : 2;
  console.info(`Video worker started (concurrency=${concurrency})`);
  const loop = async () => {
    while (!stopping) {
      try {
        const job = await claimVideoJob();
        if (job) {
          await executeVideoJob(job);
          continue;
        }
      } catch {
        console.error("Video worker database operation failed; retrying");
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };
  await Promise.all(Array.from({ length: concurrency }, loop));
  await prisma.$disconnect();
}
void main().catch(() => {
  console.error("Video worker startup failed");
  process.exitCode = 1;
});
