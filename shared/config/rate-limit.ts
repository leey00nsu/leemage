export type RateLimitPolicyId = "login" | "api" | "uploadConfirm";

export const RATE_LIMIT_CONFIG = {
  login: {
    windowMs: 60 * 1000,
    maxRequests: 5,
    blockDurationMs: 15 * 60 * 1000,
  },
  api: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    blockDurationMs: 60 * 1000,
  },
  uploadConfirm: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    blockDurationMs: 5 * 60 * 1000,
  },
} as const;

export function getRateLimitPolicyIdForPath(pathname: string): RateLimitPolicyId {
  if (pathname === "/api/auth/login") {
    return "login";
  }

  if (/^\/api(?:\/v1)?\/projects\/[^/]+\/files\/confirm$/.test(pathname)) {
    return "uploadConfirm";
  }

  return "api";
}

export function getRateLimitConfigForPath(pathname: string) {
  return RATE_LIMIT_CONFIG[getRateLimitPolicyIdForPath(pathname)];
}
