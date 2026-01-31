import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest, NextResponse } from "next/server";
import {
  withSessionAuth,
  validateSession,
  AUTH_ERROR_CODES,
  type AuthenticatedRequest,
} from "@/lib/auth/session-auth";

// 세션 모듈 목업
vi.mock("@/lib/session", () => ({
  getSessionDefault: vi.fn(),
  sessionOptions: {
    cookieName: "test-session",
    password: "test-password-32-chars-minimum!!",
    cookieOptions: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
    ttl: 60 * 60 * 24 * 7,
  },
}));

// 목업된 모듈 import
import { getSessionDefault } from "@/lib/session";
const mockedGetSessionDefault = vi.mocked(getSessionDefault);

describe("세션 인증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateSession", () => {
    it("로그인되지 않은 세션에서 null을 반환해야 한다", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
        username: undefined,
      } as never);

      const result = await validateSession();
      expect(result).toBeNull();
    });

    it("로그인된 세션에서 세션 데이터를 반환해야 한다", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      const result = await validateSession();
      expect(result).toEqual(mockSession);
    });

    it("세션 오류 시 null을 반환해야 한다 (내부 세부정보 노출 방지)", async () => {
      mockedGetSessionDefault.mockRejectedValue(new Error("Internal error"));

      const result = await validateSession();
      expect(result).toBeNull();
    });
  });

  describe("withSessionAuth HOF", () => {
    const createMockRequest = (url = "http://localhost/api/test") => {
      return new NextRequest(url);
    };

    const createMockContext = <T extends Record<string, string>>() => ({
      params: Promise.resolve({} as T),
    });

    it("미인증 시 401을 반환해야 한다", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
      } as never);

      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ data: "test" }));
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(
        createMockRequest(),
        createMockContext(),
      );
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe(AUTH_ERROR_CODES.NO_SESSION);
      expect(body.message).toBe("인증이 필요합니다");
      expect(handler).not.toHaveBeenCalled();
    });

    it("인증 시 핸들러를 호출해야 한다", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      const handler = vi
        .fn()
        .mockResolvedValue(NextResponse.json({ data: "protected" }));
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(
        createMockRequest(),
        createMockContext(),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBe("protected");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("인증 시 요청에 세션을 첨부해야 한다", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      let capturedSession: unknown = null;
      const handler = vi
        .fn()
        .mockImplementation((req: AuthenticatedRequest) => {
          capturedSession = req.session;
          return NextResponse.json({ success: true });
        });

      const protectedHandler = withSessionAuth(handler);
      await protectedHandler(createMockRequest(), createMockContext());

      expect(capturedSession).toEqual(mockSession);
    });

    it("redirectOnFail true일 때 리다이렉트해야 한다", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
      } as never);

      const handler = vi.fn();
      const protectedHandler = withSessionAuth(handler, {
        redirectOnFail: true,
        redirectUrl: "/auth/login",
      });

      const response = await protectedHandler(
        createMockRequest("http://localhost/api/test"),
        createMockContext(),
      );

      expect(response.status).toBe(307); // 리다이렉트 상태
      expect(response.headers.get("location")).toContain("/auth/login");
    });
  });

  describe("속성 1: 세션 인증 강제", () => {
    it("미인증 요청은 요청 세부정보와 관계없이 항상 401을 반환해야 한다", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            path: fc.webPath(),
            method: fc.constantFrom("GET", "POST", "PUT", "DELETE", "PATCH"),
          }),
          async ({ path }) => {
            // 설정: 유효한 세션 없음
            mockedGetSessionDefault.mockResolvedValue({
              isLoggedIn: false,
            } as never);

            const handler = vi
              .fn()
              .mockResolvedValue(NextResponse.json({ data: "test" }));
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest(`http://localhost${path}`);
            const response = await protectedHandler(request, {
              params: Promise.resolve({}),
            });

            // 검증: 항상 401, 핸들러 미호출
            expect(response.status).toBe(401);
            expect(handler).not.toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("인증된 요청에 대해 항상 핸들러를 실행해야 한다", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.emailAddress(),
            path: fc.webPath(),
          }),
          async ({ username, path }) => {
            // 설정: 유효한 세션
            mockedGetSessionDefault.mockResolvedValue({
              isLoggedIn: true,
              username,
            } as never);

            const handler = vi
              .fn()
              .mockResolvedValue(NextResponse.json({ success: true }));
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest(`http://localhost${path}`);
            await protectedHandler(request, { params: Promise.resolve({}) });

            // 검증: 핸들러 호출됨
            expect(handler).toHaveBeenCalledTimes(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("401 응답에 내부 오류 세부정보를 노출하지 않아야 한다", async () => {
      const internalErrorPatterns = [
        /stack/i,
        /trace/i,
        /\.ts:/,
        /\.js:/,
        /node_modules/,
        /at\s+\w+\s+\(/,
        /Error:/,
        /internal/i,
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            new Error("Internal server error"),
            new Error("Database connection failed"),
            new Error("at validateSession (/app/lib/auth.ts:42)"),
            new Error("TypeError: Cannot read property 'x' of undefined"),
          ),
          async (error) => {
            // 설정: 세션에서 에러 발생
            mockedGetSessionDefault.mockRejectedValue(error);

            const handler = vi.fn();
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest("http://localhost/api/test");
            const response = await protectedHandler(request, {
              params: Promise.resolve({}),
            });
            const body = await response.json();

            // Assert: Response doesn't contain internal details
            const responseText = JSON.stringify(body);
            for (const pattern of internalErrorPatterns) {
              expect(responseText).not.toMatch(pattern);
            }
            expect(response.status).toBe(401);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("오류 응답 형식", () => {
    it("일관된 오류 형식을 반환해야 한다", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
      } as never);

      const handler = vi.fn();
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(
        new NextRequest("http://localhost/api/test"),
        { params: Promise.resolve({}) },
      );
      const body = await response.json();

      // Verify error response structure
      expect(body).toHaveProperty("code");
      expect(body).toHaveProperty("message");
      expect(typeof body.code).toBe("string");
      expect(typeof body.message).toBe("string");
    });
  });
});
