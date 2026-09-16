import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

async function main() {
  const { claimVideoJob, executeVideoJob } = await import("../lib/video/queue");
  const { claimImageJob, executeImageJob } = await import("../lib/image/queue");
  const { prisma } = await import("../lib/prisma");
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
  let preferImage = true;
  const loop = async () => {
    while (!stopping) {
      try {
        const imageFirst = preferImage;
        preferImage = !preferImage;
        const imageJob = imageFirst ? await claimImageJob() : null;
        if (imageJob) {
          await executeImageJob(imageJob);
          continue;
        }
        const videoJob = await claimVideoJob();
        if (videoJob) {
          await executeVideoJob(videoJob);
          continue;
        }
        if (!imageFirst) {
          const fallbackImageJob = await claimImageJob();
          if (fallbackImageJob) {
            await executeImageJob(fallbackImageJob);
            continue;
          }
        }
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
