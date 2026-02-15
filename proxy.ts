import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromEdge, sessionOptions } from "@/lib/session";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import {
  apiRateLimiter,
  loginRateLimiter,
  uploadRateLimiter,
} from "@/lib/auth/rate-limiter";
import { getRateLimitPolicyIdForPath } from "@/shared/config/rate-limit";

const intlMiddleware = createMiddleware(routing);

function selectLimiter(pathname: string) {
  const policyId = getRateLimitPolicyIdForPath(pathname);

  if (policyId === "login") {
    return loginRateLimiter;
  }

  if (policyId === "uploadConfirm") {
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
    { status: 429 },
  );

  if (result.retryAfter) {
    response.headers.set("Retry-After", result.retryAfter.toString());
  }
  response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
  response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

  return response;
}

function getFallbackKey(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") ?? "unknown";
  const acceptLanguage = req.headers.get("accept-language") ?? "unknown";
  return `ua:${userAgent}|lang:${acceptLanguage}`;
}

function isExactOrSubPath(pathname: string, basePath: string) {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function isApiRoutePath(pathname: string) {
  return /^\/api(?:\/|$)/.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 요청은 레이트 리밋만 적용하고 나머지는 패스
  if (isApiRoutePath(pathname)) {
    const limiter = selectLimiter(pathname);
    const key = limiter.getKey(request);
    const effectiveKey = key === "unknown" ? getFallbackKey(request) : key;
    const result = limiter.check(effectiveKey);

    if (!result.allowed) {
      return createRateLimitResponse(result);
    }

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Remaining", result.remaining.toString());
    response.headers.set("X-RateLimit-Reset", result.resetAt.toISOString());

    return response;
  }

  // next-intl 미들웨어 실행
  const intlResponse = intlMiddleware(request);

  // next-intl이 실제 리디렉션을 수행하는 경우에만 early return
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // locale prefix 제거하여 실제 경로 추출
  const locales = routing.locales;
  let pathWithoutLocale = pathname;
  let currentLocale = routing.defaultLocale;

  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      pathWithoutLocale = pathname.slice(locale.length + 1) || "/";
      currentLocale = locale;
      break;
    }
  }

  // 보호할 경로 목록 (locale 없는 경로)
  const protectedRoutes = ["/projects", "/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    isExactOrSubPath(pathWithoutLocale, route),
  );

  // 로그인 페이지 경로 (locale 없는 경로)
  const loginPath = "/auth/login";
  const isLoginPath =
    pathWithoutLocale === loginPath || pathWithoutLocale === `${loginPath}/`;
  const needsSessionCheck = isProtectedRoute || isLoginPath;

  if (!needsSessionCheck) {
    // 공개 경로에서는 세션 복호화를 건너뛰어 proxy 장애 전파를 줄인다.
    return intlResponse;
  }

  let isLoggedIn = false;
  try {
    // 세션 쿠키가 없으면 복호화를 시도하지 않고 비로그인으로 처리한다.
    if (request.cookies.get(sessionOptions.cookieName)) {
      const session = await getSessionFromEdge(request);
      isLoggedIn = session?.isLoggedIn ?? false;
    }
  } catch {
    // 인증 경로에서도 세션 파싱 실패는 비로그인으로 간주하고 계속 진행한다.
    isLoggedIn = false;
  }

  // 1. 로그인 안 된 사용자가 보호된 경로 접근 시
  if (!isLoggedIn && isProtectedRoute) {
    // 현재 locale을 포함한 로그인 페이지로 리디렉션
    const redirectUrl = new URL(`/${currentLocale}${loginPath}`, request.url);
    redirectUrl.searchParams.set(
      "redirectedFrom",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(redirectUrl);
  }

  // 2. 로그인 된 사용자가 로그인 페이지 접근 시
  if (isLoggedIn && isLoginPath) {
    // 현재 locale을 포함한 프로젝트 페이지로 리디렉션
    return NextResponse.redirect(
      new URL(`/${currentLocale}/projects`, request.url),
    );
  }

  // 그 외의 경우 next-intl의 rewrite를 유지하면서 요청 계속 진행
  return intlResponse;
}

// proxy를 적용할 경로 설정
export const config = {
  matcher: [
    "/api/:path*",
    // 다음으로 시작하는 경로를 제외한 모든 경로 매칭
    // - `/api`, `/trpc`, `/_next`, `/_vercel`로 시작하는 경로
    // - 점이 포함된 경로 (예: `favicon.ico`)
    "/((?!api(?:/|$)|trpc(?:/|$)|_next|_vercel|.*\\..*).*)",
  ],
};
