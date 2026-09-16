import { prisma } from "@/lib/prisma";

export interface ReadinessResult {
  ready: boolean;
  checkedAt: string;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("readiness timeout")), timeoutMs);
    timer.unref?.();
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Deduplicates load-balancer probes and briefly caches both healthy and failed results. */
export function createReadinessCheck(
  checkDatabase: () => Promise<unknown>,
  options: { timeoutMs?: number; cacheMs?: number } = {},
) {
  const timeoutMs = options.timeoutMs ?? 3_000;
  const cacheMs = options.cacheMs ?? 1_000;
  let cached: { expiresAt: number; result: ReadinessResult } | undefined;
  let inFlight: Promise<ReadinessResult> | undefined;

  return async (): Promise<ReadinessResult> => {
    const now = Date.now();
    if (cached && cached.expiresAt > now) return cached.result;
    if (inFlight) return inFlight;

    inFlight = withTimeout(checkDatabase(), timeoutMs)
      .then(() => ({ ready: true, checkedAt: new Date().toISOString() }))
      .catch(() => ({ ready: false, checkedAt: new Date().toISOString() }))
      .then((result) => {
        cached = { expiresAt: Date.now() + cacheMs, result };
        return result;
      })
      .finally(() => {
        inFlight = undefined;
      });

    return inFlight;
  };
}

export const checkReadiness = createReadinessCheck(() =>
  prisma.$queryRaw`SELECT 1`,
);
