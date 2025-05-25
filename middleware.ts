import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromEdge } from "@/lib/session"; // Edge용 세션 함수 임포트
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing"; // 수정된 경로

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // next-intl 미들웨어 실행
  const intlResponse = intlMiddleware(request);
  // next-intl이 리디렉션 또는 응답을 반환하면 그대로 사용
  if (
    intlResponse.status === 307 ||
    intlResponse.status === 308 ||
    intlResponse.headers.get("x-middleware-rewrite")
  ) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;

  // 보호할 경로 목록
  const protectedRoutes = ["/projects", "/account"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 로그인 페이지 경로
  const loginPath = "/auth/login";

  // 세션 가져오기
  const session = await getSessionFromEdge(request);

  // 로그인 여부 확인
  const isLoggedIn = session?.isLoggedIn ?? false;

  // 1. 로그인 안 된 사용자가 보호된 경로 접근 시
  if (!isLoggedIn && isProtectedRoute) {
    // 로그인 페이지로 리디렉션 (원래 요청 경로는 쿼리 파라미터로 전달)
    const redirectUrl = new URL(loginPath, request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. 로그인 된 사용자가 로그인 페이지 접근 시
  if (isLoggedIn && pathname === loginPath) {
    // 프로젝트로 리디렉션
    return NextResponse.redirect(new URL("/projects", request.url));
  }

  // 그 외의 경우 요청 계속 진행
  return NextResponse.next();
}

// 미들웨어를 적용할 경로 설정
export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
