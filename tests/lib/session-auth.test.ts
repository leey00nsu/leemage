/**
 * Session Authentication Unit & Property Tests
 * 
 * **Feature: security-hardening, Property 1: Session Authentication Enforcement**
 * **Validates: Requirements 1.1, 1.2, 1.5**
 * 
 * Tests that:
 * - Unauthenticated requests return 401
 * - Valid sessions allow request to proceed
 * - Error responses don't expose internal details
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { NextRequest, NextResponse } from "next/server";
import {
  withSessionAuth,
  validateSession,
  AUTH_ERROR_CODES,
  type AuthenticatedRequest,
} from "@/lib/auth/session-auth";

// Mock the session module
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

// Import the mocked module
import { getSessionDefault } from "@/lib/session";
const mockedGetSessionDefault = vi.mocked(getSessionDefault);

describe("Session Authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("validateSession", () => {
    it("should return null when session is not logged in", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
        username: undefined,
      } as never);

      const result = await validateSession();
      expect(result).toBeNull();
    });

    it("should return session data when logged in", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      const result = await validateSession();
      expect(result).toEqual(mockSession);
    });

    it("should return null when session throws error (not expose internal details)", async () => {
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

    it("should return 401 when not authenticated", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
      } as never);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: "test" }));
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(createMockRequest(), createMockContext());
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.code).toBe(AUTH_ERROR_CODES.NO_SESSION);
      expect(body.message).toBe("인증이 필요합니다");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should call handler when authenticated", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: "protected" }));
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(createMockRequest(), createMockContext());
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toBe("protected");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should attach session to request when authenticated", async () => {
      const mockSession = {
        isLoggedIn: true,
        username: "test@example.com",
      };
      mockedGetSessionDefault.mockResolvedValue(mockSession as never);

      let capturedSession: unknown = null;
      const handler = vi.fn().mockImplementation((req: AuthenticatedRequest) => {
        capturedSession = req.session;
        return NextResponse.json({ success: true });
      });

      const protectedHandler = withSessionAuth(handler);
      await protectedHandler(createMockRequest(), createMockContext());

      expect(capturedSession).toEqual(mockSession);
    });

    it("should redirect when redirectOnFail is true", async () => {
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
        createMockContext()
      );

      expect(response.status).toBe(307); // Redirect status
      expect(response.headers.get("location")).toContain("/auth/login");
    });
  });

  describe("Property 1: Session Authentication Enforcement", () => {
    /**
     * Property: For any request to a protected endpoint without a valid session,
     * the middleware SHALL return 401 and NOT execute the handler.
     */
    it("should always return 401 for unauthenticated requests regardless of request details", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            path: fc.webPath(),
            method: fc.constantFrom("GET", "POST", "PUT", "DELETE", "PATCH"),
          }),
          async ({ path }) => {
            // Setup: No valid session
            mockedGetSessionDefault.mockResolvedValue({
              isLoggedIn: false,
            } as never);

            const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: "test" }));
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest(`http://localhost${path}`);
            const response = await protectedHandler(request, { params: Promise.resolve({}) });

            // Assert: Always 401, handler never called
            expect(response.status).toBe(401);
            expect(handler).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: For any valid session, the handler SHALL be executed.
     */
    it("should always execute handler for authenticated requests", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            username: fc.emailAddress(),
            path: fc.webPath(),
          }),
          async ({ username, path }) => {
            // Setup: Valid session
            mockedGetSessionDefault.mockResolvedValue({
              isLoggedIn: true,
              username,
            } as never);

            const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest(`http://localhost${path}`);
            await protectedHandler(request, { params: Promise.resolve({}) });

            // Assert: Handler was called
            expect(handler).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Error responses SHALL NOT contain internal error details.
     */
    it("should never expose internal error details in 401 responses", async () => {
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
            new Error("TypeError: Cannot read property 'x' of undefined")
          ),
          async (error) => {
            // Setup: Session throws error
            mockedGetSessionDefault.mockRejectedValue(error);

            const handler = vi.fn();
            const protectedHandler = withSessionAuth(handler);

            const request = new NextRequest("http://localhost/api/test");
            const response = await protectedHandler(request, { params: Promise.resolve({}) });
            const body = await response.json();

            // Assert: Response doesn't contain internal details
            const responseText = JSON.stringify(body);
            for (const pattern of internalErrorPatterns) {
              expect(responseText).not.toMatch(pattern);
            }
            expect(response.status).toBe(401);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Error Response Format", () => {
    it("should return consistent error format", async () => {
      mockedGetSessionDefault.mockResolvedValue({
        isLoggedIn: false,
      } as never);

      const handler = vi.fn();
      const protectedHandler = withSessionAuth(handler);

      const response = await protectedHandler(
        new NextRequest("http://localhost/api/test"),
        { params: Promise.resolve({}) }
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
