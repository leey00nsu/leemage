import { type NextRequest, NextResponse } from "next/server";
import { getSessionDefault, SessionData } from "@/lib/session";
import { logApiCall } from "@/lib/api/api-logger";
import { consumeResponseLogMetadata } from "@/lib/api/request-log-metadata";

/**
 * Session authentication options
 */
export interface SessionAuthOptions {
  /** If true, redirect to login page on auth failure (for page routes) */
  redirectOnFail?: boolean;
  /** Custom redirect URL */
  redirectUrl?: string;
}

/**
 * Extended request type with session data attached
 */
export interface AuthenticatedRequest extends NextRequest {
  session: SessionData;
}

/**
 * Authentication error codes
 */
export const AUTH_ERROR_CODES = {
  NO_SESSION: "AUTH_NO_SESSION",
  INVALID_SESSION: "AUTH_INVALID_SESSION",
} as const;

/**
 * Validates session and returns session data or null
 * Does not expose internal error details
 */
export async function validateSession(): Promise<SessionData | null> {
  try {
    const session = await getSessionDefault();

    if (!session.isLoggedIn) {
      return null;
    }

    return session;
  } catch {
    // Don't expose internal errors - just return null for invalid session
    return null;
  }
}

/**
 * Creates a 401 Unauthorized response without exposing internal details
 */
function createUnauthorizedResponse(code: string): NextResponse {
  return NextResponse.json(
    {
      code,
      message:
        code === AUTH_ERROR_CODES.NO_SESSION
          ? "인증이 필요합니다"
          : "세션이 만료되었습니다",
    },
    { status: 401 },
  );
}

/**
 * Higher-Order Function that wraps API route handlers with session authentication.
 * Also logs API calls to the database for monitoring.
 *
 * Usage:
 * ```typescript
 * export const GET = withSessionAuth(async (req, context) => {
 *   // req.session is available here
 *   return NextResponse.json({ data: "protected" });
 * });
 * ```
 *
 * @param handler - The API route handler to protect
 * @param options - Optional configuration
 * @returns Wrapped handler with authentication
 */
export function withSessionAuth<T extends Record<string, string | string[]>>(
  handler: (
    req: AuthenticatedRequest,
    context: { params: Promise<T> },
  ) => Promise<NextResponse> | NextResponse,
  options?: SessionAuthOptions,
) {
  return async (
    req: NextRequest,
    context: { params: Promise<T> },
  ): Promise<NextResponse> => {
    const startTime = Date.now();
    const session = await validateSession();

    if (!session) {
      // Handle redirect for page routes if configured
      if (options?.redirectOnFail) {
        const redirectUrl = options.redirectUrl || "/auth/login";
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }

      return createUnauthorizedResponse(AUTH_ERROR_CODES.NO_SESSION);
    }

    // Attach session to request for handler access
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.session = session;

    // Execute the original handler
    const response = await handler(authenticatedReq, context);
    const extraMetadata = consumeResponseLogMetadata(response);

    // Log the API call (don't await to avoid blocking response)
    const durationMs = Date.now() - startTime;
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Extract projectId from path if present
    const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : undefined;

    logApiCall({
      userId: session.username ?? "",
      projectId,
      endpoint: pathname,
      method: req.method,
      statusCode: response.status,
      durationMs,
      metadata: {
        ...(extraMetadata ?? {}),
        authSource: "ui",
      },
    }).catch(() => {
      // Ignore logging errors silently
    });

    return response;
  };
}

/**
 * Utility function to get current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<string | null> {
  const session = await validateSession();
  return session?.username ?? null;
}
