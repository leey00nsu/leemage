import { type NextRequest, NextResponse } from "next/server";
import type { AuthenticatedRequest } from "./session-auth";
import { RATE_LIMIT_CONFIG } from "@/shared/config/rate-limit";

// ============================================
// Rate Limit Store Interface & Implementations
// ============================================

/**
 * Rate limit entry stored in the store
 */
export interface RateLimitEntry {
  /** Timestamps of requests in current window */
  requests: number[];
  /** If blocked, when the block expires */
  blockedUntil?: number;
}

/**
 * Interface for rate limit storage backends.
 * Implement this interface to use Redis or other storage.
 */
export interface RateLimitStore {
  /** Get entry for a key, returns null if not found */
  get(key: string): RateLimitEntry | null;
  /** Set entry for a key */
  set(key: string, entry: RateLimitEntry): void;
  /** Delete entry for a key */
  delete(key: string): void;
  /** Optional cleanup method for removing stale entries */
  cleanup?(windowMs: number): void;
  /** Get current entry count (for testing/monitoring) */
  size(): number;
}

/**
 * In-memory implementation of RateLimitStore.
 * Suitable for single-server deployments.
 */
export class MemoryStore implements RateLimitStore {
  private entries: Map<string, RateLimitEntry> = new Map();

  get(key: string): RateLimitEntry | null {
    return this.entries.get(key) ?? null;
  }

  set(key: string, entry: RateLimitEntry): void {
    this.entries.set(key, entry);
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  cleanup(windowMs: number): void {
    const now = Date.now();
    const windowStart = now - windowMs;

    for (const [key, entry] of this.entries) {
      const hasRecentRequests = entry.requests.some((t) => t > windowStart);
      const isBlocked = entry.blockedUntil && entry.blockedUntil > now;

      if (!hasRecentRequests && !isBlocked) {
        this.entries.delete(key);
      }
    }
  }

  size(): number {
    return this.entries.size;
  }
}

// ============================================
// Rate Limiter Configuration & Types
// ============================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed per window */
  maxRequests: number;
  /** Block duration in milliseconds when limit exceeded */
  blockDurationMs: number;
  /** Custom key generator function */
  keyGenerator?: (req: NextRequest) => string;
  /** Custom storage backend (defaults to MemoryStore) */
  store?: RateLimitStore;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit resets */
  resetAt: Date;
  /** Seconds until retry is allowed (only when blocked) */
  retryAfter?: number;
}

// ============================================
// Rate Limiter Class
// ============================================

/**
 * Rate limiter using sliding window algorithm.
 * Supports pluggable storage backends via RateLimitStore interface.
 */
export class RateLimiter {
  private store: RateLimitStore;
  private config: Omit<Required<RateLimitConfig>, "store">;

  constructor(config: RateLimitConfig) {
    this.store = config.store ?? new MemoryStore();
    this.config = {
      windowMs: config.windowMs,
      maxRequests: config.maxRequests,
      blockDurationMs: config.blockDurationMs,
      keyGenerator: config.keyGenerator ?? this.defaultKeyGenerator,
    };

    // Cleanup old entries periodically (every minute)
    if (typeof setInterval !== "undefined" && this.store.cleanup) {
      setInterval(() => this.store.cleanup?.(this.config.windowMs), 60000);
    }
  }

  /**
   * Default key generator using IP address
   */
  private defaultKeyGenerator(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }
    
    const realIp = req.headers.get("x-real-ip");
    if (realIp) {
      return realIp;
    }

    return "unknown";
  }

  /**
   * Check if a request is allowed under the rate limit
   */
  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    let entry = this.store.get(key);

    // Initialize entry if not exists
    if (!entry) {
      entry = { requests: [] };
    }

    // Check if currently blocked
    if (entry.blockedUntil && entry.blockedUntil > now) {
      const retryAfter = Math.ceil((entry.blockedUntil - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter,
      };
    }

    // Clear block if expired
    if (entry.blockedUntil && entry.blockedUntil <= now) {
      entry.blockedUntil = undefined;
      entry.requests = [];
    }

    // Filter requests within the current window (sliding window)
    entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (entry.requests.length >= this.config.maxRequests) {
      entry.blockedUntil = now + this.config.blockDurationMs;
      this.store.set(key, entry);
      const retryAfter = Math.ceil(this.config.blockDurationMs / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil),
        retryAfter,
      };
    }

    // Add current request
    entry.requests.push(now);
    this.store.set(key, entry);

    const oldestRequest = entry.requests[0];
    const resetAt = new Date(oldestRequest + this.config.windowMs);

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.requests.length,
      resetAt,
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get the key for a request
   */
  getKey(req: NextRequest): string {
    return this.config.keyGenerator(req);
  }

  /**
   * Get current entry count (for testing/monitoring)
   */
  getEntryCount(): number {
    return this.store.size();
  }
}

// ============================================
// Response Helpers
// ============================================

/**
 * Creates a 429 Too Many Requests response
 */
function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      code: "RATE_LIMIT_EXCEEDED",
      message: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
    },
    { status: 429 }
  );

  if (result.retryAfter) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return response;
}

// ============================================
// Higher-Order Functions
// ============================================

/**
 * HOF that wraps handlers with rate limiting.
 */
export function withRateLimit<T extends Record<string, string | string[]>>(
  handler: (
    req: NextRequest,
    context: { params: Promise<T> }
  ) => Promise<NextResponse> | NextResponse,
  limiter: RateLimiter
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const key = limiter.getKey(req);
    const result = limiter.check(key);

    if (!result.allowed) {
      return createRateLimitResponse(result);
    }

    const response = await handler(req, context);
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

    return response;
  };
}

/**
 * Combines rate limiting with session authentication.
 */
export function withRateLimitAndAuth<T extends Record<string, string | string[]>>(
  handler: (
    req: AuthenticatedRequest,
    context: { params: Promise<T> }
  ) => Promise<NextResponse> | NextResponse,
  limiter: RateLimiter
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> }
  ): Promise<NextResponse> => {
    const key = limiter.getKey(req);
    const result = limiter.check(key);

    if (!result.allowed) {
      return createRateLimitResponse(result);
    }

    // Validate session first
    const { validateSession } = await import("./session-auth");
    const session = await validateSession();
    
    if (!session) {
      return NextResponse.json(
        { code: "AUTH_NO_SESSION", message: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // Attach session to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.session = session;
    
    const response = await handler(authenticatedReq, context);
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

    return response;
  };
}

// ============================================
// Pre-configured Rate Limiters
// ============================================

/** Login: 5 requests/minute, 15 minute block */
export const loginRateLimiter = new RateLimiter({
  ...RATE_LIMIT_CONFIG.login,
});

/** API: 100 requests/minute, 1 minute block */
export const apiRateLimiter = new RateLimiter({
  ...RATE_LIMIT_CONFIG.api,
});

/** Upload: 20 requests/minute, 5 minute block */
export const uploadRateLimiter = new RateLimiter({
  ...RATE_LIMIT_CONFIG.uploadConfirm,
});
