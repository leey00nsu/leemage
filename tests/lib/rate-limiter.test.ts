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

  describe("기본 기능", () => {
    // Tests remaining count decrement (not covered by property tests)
    it("남은 횟수가 감소해야 한다", () => {
      const key = "test-ip";

      for (let i = 0; i < 5; i++) {
        const result = limiter.check(key);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    // Tests key isolation (not covered by property tests)
    it("다른 키를 별도로 추적해야 한다", () => {
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
    it("슬라이딩 윈도우를 정확히 사용해야 한다", () => {
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

  describe("속성 2: 요청 제한 슬라이딩 윈도우 정확성", () => {
    it("임의의 요청 패턴에 대해 슬라이딩 윈도우를 정확히 적용해야 한다", async () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("윈도우 만료 후 요청을 허용해야 한다", async () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // reset() is a specific API method, not covered by property tests
  describe("reset", () => {
    it("키의 요청 제한을 초기화해야 한다", () => {
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

  it("제한 내 요청을 허용해야 한다", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ success: true }));
    const limitedHandler = withRateLimit(handler, limiter);

    const response = await limitedHandler(
      createMockRequest(),
      createMockContext(),
    );

    expect(response.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });

  it("제한 초과 시 429를 반환해야 한다", async () => {
    const handler = vi
      .fn()
      .mockResolvedValue(NextResponse.json({ success: true }));
    const limitedHandler = withRateLimit(handler, limiter);

    // Make requests up to and over limit
    for (let i = 0; i < 3; i++) {
      await limitedHandler(createMockRequest(), createMockContext());
    }

    // 4th request should be blocked
    const response = await limitedHandler(
      createMockRequest(),
      createMockContext(),
    );

    expect(response.status).toBe(429);
    expect(handler).toHaveBeenCalledTimes(3); // Only first 3 calls
  });

  describe("속성 3: 요청 제한 응답 헤더", () => {
    it("429 응답에 항상 Retry-After 헤더를 포함해야 한다", async () => {
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

            const handler = vi
              .fn()
              .mockResolvedValue(NextResponse.json({ ok: true }));
            const limitedHandler = withRateLimit(handler, testLimiter);

            // Exhaust limit
            for (let i = 0; i < maxRequests; i++) {
              await limitedHandler(createMockRequest(), createMockContext());
            }

            // Get blocked response
            const response = await limitedHandler(
              createMockRequest(),
              createMockContext(),
            );

            // Assert: 429 status
            expect(response.status).toBe(429);

            // Assert: Retry-After header exists and is positive integer
            const retryAfter = response.headers.get("Retry-After");
            expect(retryAfter).not.toBeNull();

            const retryAfterValue = parseInt(retryAfter!, 10);
            expect(Number.isInteger(retryAfterValue)).toBe(true);
            expect(retryAfterValue).toBeGreaterThan(0);

            vi.useRealTimers();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("성공 응답에 요청 제한 헤더를 포함해야 한다", async () => {
      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ ok: true }));
      const limitedHandler = withRateLimit(handler, limiter);

      const response = await limitedHandler(
        createMockRequest(),
        createMockContext(),
      );

      expect(response.headers.get("X-RateLimit-Remaining")).not.toBeNull();
      expect(response.headers.get("X-RateLimit-Reset")).not.toBeNull();
    });
  });
});

describe("사전 설정된 요청 제한기", () => {
  it("loginRateLimiter가 올바르게 설정되어야 한다", () => {
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

  it("apiRateLimiter가 올바르게 설정되어야 한다", () => {
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

  it("uploadRateLimiter가 올바르게 설정되어야 한다", () => {
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

describe("IP 주소 추출", () => {
  it("x-forwarded-for 헤더에서 IP를 추출해야 한다", () => {
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

  it("x-real-ip 헤더에서 IP를 추출해야 한다", () => {
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

  it("사용자 정의 키 생성기를 사용해야 한다", () => {
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

describe("MemoryStore", () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  describe("기본 작업", () => {
    it("존재하지 않는 키에 대해 null을 반환해야 한다", () => {
      expect(store.get("nonexistent")).toBeNull();
    });

    it("항목을 저장하고 검색해야 한다", () => {
      const entry: RateLimitEntry = {
        requests: [1000, 2000],
        blockedUntil: 5000,
      };
      store.set("key1", entry);
      expect(store.get("key1")).toEqual(entry);
    });

    it("항목을 삭제해야 한다", () => {
      store.set("key1", { requests: [1000] });
      store.delete("key1");
      expect(store.get("key1")).toBeNull();
    });

    it("크기를 정확히 추적해야 한다", () => {
      expect(store.size()).toBe(0);
      store.set("key1", { requests: [] });
      expect(store.size()).toBe(1);
      store.set("key2", { requests: [] });
      expect(store.size()).toBe(2);
      store.delete("key1");
      expect(store.size()).toBe(1);
    });
  });

  describe("속성 1: 저장소 작업 일관성", () => {
    it("모든 키-값 쌍에 대해 일관성을 유지해야 한다", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.array(fc.integer({ min: 0, max: Number.MAX_SAFE_INTEGER }), {
            minLength: 0,
            maxLength: 100,
          }),
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("모든 키에 대해 삭제 후 null을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 50 }), (key) => {
          store.set(key, { requests: [Date.now()] });
          store.delete(key);
          expect(store.get(key)).toBeNull();
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("사용자 정의 저장소 주입", () => {
    it("사용자 정의 저장소를 사용해야 한다", () => {
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
