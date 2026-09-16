import { beforeEach, expect, it, vi } from "vitest";

const executeRaw = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({
  prisma: { $executeRaw: executeRaw },
}));

import { cleanupExpiredApiLogs } from "@/lib/api/api-log-retention";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

it("deletes old logs in bounded batches", async () => {
  executeRaw.mockResolvedValueOnce(5_000).mockResolvedValueOnce(12);
  await expect(cleanupExpiredApiLogs()).resolves.toBe(5_012);
  expect(executeRaw).toHaveBeenCalledTimes(2);
});

it("stops after the configured maximum number of batches", async () => {
  executeRaw.mockResolvedValue(5_000);
  await expect(cleanupExpiredApiLogs(2)).resolves.toBe(10_000);
  expect(executeRaw).toHaveBeenCalledTimes(2);
});
