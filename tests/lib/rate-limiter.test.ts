/**
 * Rate Limiter Unit & Property Tests
 * 
 * **Feature: security-hardening, Property 2: Rate Limit Sliding Window Accuracy**
 * **Feature: security-hardening, Property 3: Rate Limit Response Headers**
 * **Feature: security-hardening-improvements, Property 1: Store Operation Consistency**
 * **Validates: Requirements 2.1, 2.2, 2.4, 2.5, 1.2**
 * 
 * Tests that:
 * - Sliding window algorithm correctly tracks requests
 * - Rate limits are enforced accurately
 * - 429 responses include Retry-After header
 * - MemoryStore implements RateLimitStore interface correctly
 * 
 * Note: Basic blocking/reset behavior is covered by Property 2 tests.
 * Unit tests focus on edge cases and specific behaviors not covered by property tests.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest, NextResponse } from "next/server";
import {
  RateLimiter,
  MemoryStore,
  withRateLimit,
  loginRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  type RateLimitEntry,
} from "@/lib/auth/rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      blockDurationMs: 300000, // 5 minutes
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Basic functionality", () => {
    // Tests remaining count decrement (not covered by property tests)
    it("should correctly decrement remaining count", () => {
      const key = "test-ip";
      
      for (let i = 0; i < 5; i++) {
        const result = limiter.check(key);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    // Tests key isolation (not covered by property tests)
    it("should track different keys separately", () => {
      const key1 = "ip-1";
      const key2 = "ip-2";

      // Exhaust limit for key1
      for (let i = 0; i < 5; i++) {
        limiter.check(key1);
      }

      // key2 should still be allowed
      const result = limiter.check(key2);
      expect(result.allowed).toBe(true);
    });

    // Tests sliding window with time advancement (specific timing behavior)
    it("should use sliding window correctly", () => {
      const slidingLimiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        blockDurationMs: 1000,
      });
      const key = "test-ip-sliding";

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        slidingLimiter.check(key);
      }

      // Advance time by 30 seconds
      vi.advanceTimersByTime(30000);

      // Make 2 more requests (total 5 in window)
      for (let i = 0; i < 2; i++) {
        slidingLimiter.check(key);
      }

      // 6th request should trigger block
      let result = slidingLimiter.check(key);
      expect(result.allowed).toBe(false);

      // Advance time past block duration + first 3 requests window expiry
      vi.advanceTimersByTime(31000);

      // Should be allowed again
      result = slidingLimiter.check(key);
      expect(result.allowed).toBe(true);
    });
  });

  describe("Property 2: Rate Limit Sliding Window Accuracy", () => {
    /**
     * Property: For any sequence of N requests within window W,
     * if N exceeds limit, subsequent requests are blocked until
     * oldest request expires from window.
     */
    it("should correctly enforce sliding window for any request pattern", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxRequests: fc.integer({ min: 1, max: 20 }),
            windowMs: fc.integer({ min: 1000, max: 60000 }),
            requestCount: fc.integer({ min: 1, max: 30 }),
          }),
          async ({ maxRequests, windowMs, requestCount }) => {
            const testLimiter = new RateLimiter({
              windowMs,
              maxRequests,
              blockDurationMs: windowMs * 2,
            });

            const key = "test-key";
            let allowedCount = 0;
            let blockedCount = 0;

            for (let i = 0; i < requestCount; i++) {
              const result = testLimiter.check(key);
              if (result.allowed) {
                allowedCount++;
              } else {
                blockedCount++;
              }
            }

            // Property: allowed count should never exceed maxRequests
            expect(allowedCount).toBeLessThanOrEqual(maxRequests);

            // Property: if we made more requests than limit, some should be blocked
            if (requestCount > maxRequests) {
              expect(blockedCount).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Requests should be allowed again after window expires
     */
    it("should allow requests after window expiration", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxRequests: fc.integer({ min: 1, max: 10 }),
            windowMs: fc.integer({ min: 100, max: 1000 }),
          }),
          async ({ maxRequests, windowMs }) => {
            vi.useFakeTimers();
            
            const testLimiter = new RateLimiter({
              windowMs,
              maxRequests,
              blockDurationMs: windowMs,
            });

            const key = "test-key";

            // Exhaust the limit
            for (let i = 0; i < maxRequests; i++) {
              testLimiter.check(key);
            }

            // Should be blocked
            let result = testLimiter.check(key);
            expect(result.allowed).toBe(false);

            // Advance past block duration
            vi.advanceTimersByTime(windowMs + 1);

            // Should be allowed again
            result = testLimiter.check(key);
            expect(result.allowed).toBe(true);

            vi.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // reset() is a specific API method, not covered by property tests
  describe("reset", () => {
    it("should clear rate limit for a key", () => {
      const key = "test-ip";

      // Exhaust limit
      for (let i = 0; i < 6; i++) {
        limiter.check(key);
      }

      // Reset
      limiter.reset(key);

      // Should be allowed again
      const result = limiter.check(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });
});

describe("withRateLimit HOF", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 3,
      blockDurationMs: 60000,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const createMockRequest = (ip = "127.0.0.1") => {
    return new NextRequest("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": ip,
      },
    });
  };

  const createMockContext = () => ({
    params: Promise.resolve({}),
  });

  it("should allow requests under limit", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const limitedHandler = withRateLimit(handler, limiter);

    const response = await limitedHandler(createMockRequest(), createMockContext());

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("should return 429 when limit exceeded", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const limitedHandler = withRateLimit(handler, limiter);

    // Make requests up to and over limit
    for (let i = 0; i < 3; i++) {
      await limitedHandler(createMockRequest(), createMockContext());
    }

    // 4th request should be blocked
    const response = await limitedHandler(createMockRequest(), createMockContext());

    expect(response.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(3); // Only first 3 calls
  });

  describe("Property 3: Rate Limit Response Headers", () => {
    /**
     * Property: For any rate-limited response (429),
     * the response SHALL include Retry-After header with positive integer.
     */
    it("should always include Retry-After header in 429 responses", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxRequests: fc.integer({ min: 1, max: 5 }),
            blockDurationMs: fc.integer({ min: 1000, max: 60000 }),
          }),
          async ({ maxRequests, blockDurationMs }) => {
            vi.useFakeTimers();

            const testLimiter = new RateLimiter({
              windowMs: 60000,
              maxRequests,
              blockDurationMs,
            });

            const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
            const limitedHandler = withRateLimit(handler, testLimiter);

            // Exhaust limit
            for (let i = 0; i < maxRequests; i++) {
              await limitedHandler(createMockRequest(), createMockContext());
            }

            // Get blocked response
            const response = await limitedHandler(createMockRequest(), createMockContext());

            // Assert: 429 status
            expect(response.status).toBe(429);

            // Assert: Retry-After header exists and is positive integer
            const retryAfter = response.headers.get("Retry-After");
            expect(retryAfter).not.toBeNull();
            
            const retryAfterValue = parseInt(retryAfter!, 10);
            expect(Number.isInteger(retryAfterValue)).toBe(true);
            expect(retryAfterValue).toBeGreaterThan(0);

            vi.useRealTimers();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Successful responses should include rate limit info headers
     */
    it("should include rate limit headers in successful responses", async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const limitedHandler = withRateLimit(handler, limiter);

      const response = await limitedHandler(createMockRequest(), createMockContext());

      expect(response.headers.get("X-RateLimit-Remaining")).not.toBeNull();
      expect(response.headers.get("X-RateLimit-Reset")).not.toBeNull();
    });
  });
});

describe("Pre-configured Rate Limiters", () => {
  it("loginRateLimiter should have correct config", () => {
    // 5 requests per minute, 15 minute block
    const key = "test";
    
    // Should allow 5 requests
    for (let i = 0; i < 5; i++) {
      const result = loginRateLimiter.check(key);
      expect(result.allowed).toBe(true);
    }

    // 6th should be blocked
    const result = loginRateLimiter.check(key);
    expect(result.allowed).toBe(false);
    
    // Block should be ~15 minutes (900 seconds)
    expect(result.retryAfter).toBeGreaterThanOrEqual(899);
    expect(result.retryAfter).toBeLessThanOrEqual(901);

    // Reset for other tests
    loginRateLimiter.reset(key);
  });

  it("apiRateLimiter should have correct config", () => {
    const key = "test-api";
    
    // Should allow 100 requests
    for (let i = 0; i < 100; i++) {
      const result = apiRateLimiter.check(key);
      expect(result.allowed).toBe(true);
    }

    // 101st should be blocked
    const result = apiRateLimiter.check(key);
    expect(result.allowed).toBe(false);

    // Reset for other tests
    apiRateLimiter.reset(key);
  });

  it("uploadRateLimiter should have correct config", () => {
    const key = "test-upload";
    
    // Should allow 20 requests
    for (let i = 0; i < 20; i++) {
      const result = uploadRateLimiter.check(key);
      expect(result.allowed).toBe(true);
    }

    // 21st should be blocked
    const result = uploadRateLimiter.check(key);
    expect(result.allowed).toBe(false);

    // Reset for other tests
    uploadRateLimiter.reset(key);
  });
});

describe("IP Address Extraction", () => {
  it("should extract IP from x-forwarded-for header", () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 60000,
    });

    const req = new NextRequest("http://localhost/api/test", {
      headers: {
        "x-forwarded-for": "192.168.1.1, 10.0.0.1",
      },
    });

    const key = limiter.getKey(req);
    expect(key).toBe("192.168.1.1");
  });

  it("should extract IP from x-real-ip header", () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 60000,
    });

    const req = new NextRequest("http://localhost/api/test", {
      headers: {
        "x-real-ip": "192.168.1.2",
      },
    });

    const key = limiter.getKey(req);
    expect(key).toBe("192.168.1.2");
  });

  it("should use custom key generator if provided", () => {
    const limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 60000,
      keyGenerator: (req) => req.headers.get("x-custom-id") || "default",
    });

    const req = new NextRequest("http://localhost/api/test", {
      headers: {
        "x-custom-id": "user-123",
      },
    });

    const key = limiter.getKey(req);
    expect(key).toBe("user-123");
  });
});

/**
 * MemoryStore Tests
 * 
 * **Feature: security-hardening-improvements, Property 1: Store Operation Consistency**
 * **Validates: Requirements 1.2**
 */
describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe("Basic operations", () => {
    it("should return null for non-existent key", () => {
      expect(store.get("nonexistent")).toBeNull();
    });

    it("should store and retrieve entry", () => {
      const entry: RateLimitEntry = { requests: [1000, 2000], blockedUntil: 5000 };
      store.set("key1", entry);
      expect(store.get("key1")).toEqual(entry);
    });

    it("should delete entry", () => {
      store.set("key1", { requests: [1000] });
      store.delete("key1");
      expect(store.get("key1")).toBeNull();
    });

    it("should track size correctly", () => {
      expect(store.size()).toBe(0);
      store.set("key1", { requests: [] });
      expect(store.size()).toBe(1);
      store.set("key2", { requests: [] });
      expect(store.size()).toBe(2);
      store.delete("key1");
      expect(store.size()).toBe(1);
    });
  });

  /**
   * Property 1: Store Operation Consistency
   * For any key and RateLimitEntry, after calling store.set(key, entry),
   * calling store.get(key) SHALL return an equivalent entry.
   */
  describe("Property 1: Store Operation Consistency", () => {
    it("should maintain consistency for any key-value pair", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), { minLength: 0, maxLength: 100 }),
          fc.option(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER })),
          (key, requests, blockedUntil) => {
            const entry: RateLimitEntry = {
              requests,
              blockedUntil: blockedUntil ?? undefined,
            };

            store.set(key, entry);
            const retrieved = store.get(key);

            expect(retrieved).not.toBeNull();
            expect(retrieved!.requests).toEqual(entry.requests);
            expect(retrieved!.blockedUntil).toEqual(entry.blockedUntil);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return null after delete for any key", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (key) => {
            store.set(key, { requests: [Date.now()] });
            store.delete(key);
            expect(store.get(key)).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Custom store injection", () => {
    it("should use custom store when provided", () => {
      const customStore = new MemoryStore();
      const limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 5,
        blockDurationMs: 60000,
        store: customStore,
      });

      limiter.check("test-key");
      expect(customStore.size()).toBe(1);
      expect(customStore.get("test-key")).not.toBeNull();
    });
  });
});
