import type { NextRequest } from "next/server";

const DEFAULT_TRUSTED_PROXY_HOPS = 1;
const MAX_TRUSTED_PROXY_HOPS = 10;

function trustedProxyHops() {
  const configured = Number.parseInt(process.env.TRUST_PROXY_HOPS ?? "", 10);
  if (!Number.isInteger(configured)) return DEFAULT_TRUSTED_PROXY_HOPS;
  return Math.min(Math.max(configured, 0), MAX_TRUSTED_PROXY_HOPS);
}

function normalizeIp(value: string | undefined) {
  const candidate = value?.trim();
  if (!candidate || candidate.length > 64 || /[\s,]/.test(candidate)) {
    return null;
  }
  return candidate;
}

/**
 * Returns the address added by the configured trusted proxy boundary.
 * Production must prevent direct access to the application port.
 */
export function getClientIp(request: NextRequest): string {
  const trustedHops = trustedProxyHops();
  if (trustedHops === 0) return "unknown";

  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (forwarded?.length && forwarded.length >= trustedHops) {
    return normalizeIp(forwarded[forwarded.length - trustedHops]) ?? "unknown";
  }

  return normalizeIp(request.headers.get("x-real-ip") ?? undefined) ?? "unknown";
}
