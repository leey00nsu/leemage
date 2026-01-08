import { NextRequest, NextResponse } from "next/server";
import {
  apiRateLimiter,
  loginRateLimiter,
  uploadRateLimiter,
} from "@/lib/auth/rate-limiter";

function selectLimiter(pathname: string) {
  if (pathname === "/api/auth/login") {
    return loginRateLimiter;
  }

  if (/^\/api\/projects\/[^/]+\/files\/confirm$/.test(pathname)) {
    return uploadRateLimiter;
  }

  return apiRateLimiter;
}

function createRateLimitResponse(result: {
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}) {
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

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return NextResponse.next();
  }

  const pathname = req.nextUrl.pathname;
  const limiter = selectLimiter(pathname);
  const key = limiter.getKey(req);
  const result = limiter.check(key);

  if (!result.allowed) {
    return createRateLimitResponse(result);
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
