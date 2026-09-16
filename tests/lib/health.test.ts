import { describe, expect, it, vi } from "vitest";
import { createReadinessCheck } from "@/lib/health";

describe("createReadinessCheck", () => {
  it("reports a successful database check", async () => {
    const check = createReadinessCheck(async () => 1, { cacheMs: 0 });
    await expect(check()).resolves.toMatchObject({ ready: true });
  });

  it("returns unavailable without exposing the database error", async () => {
    const check = createReadinessCheck(
      async () => {
        throw new Error("postgresql://secret@internal-db");
      },
      { cacheMs: 0 },
    );

    const result = await check();
    expect(result.ready).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("deduplicates concurrent probes and caches the result", async () => {
    const databaseCheck = vi.fn(async () => 1);
    const check = createReadinessCheck(databaseCheck, { cacheMs: 1_000 });

    await Promise.all([check(), check(), check()]);
    await check();

    expect(databaseCheck).toHaveBeenCalledTimes(1);
  });

  it("fails closed when the database check exceeds its deadline", async () => {
    const check = createReadinessCheck(
      () => new Promise(() => undefined),
      { timeoutMs: 5, cacheMs: 0 },
    );

    await expect(check()).resolves.toMatchObject({ ready: false });
  });
});
