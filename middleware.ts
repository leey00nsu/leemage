import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromEdge } from "@/lib/session"; // Edge용 세션 함수 임포트

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 보호할 경로 목록
  const protectedRoutes = ["/dashboard", "/projects"];
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
    // 대시보드로 리디렉션
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 그 외의 경우 요청 계속 진행
  return NextResponse.next();
}

// 미들웨어를 적용할 경로 설정
export const config = {
  matcher: [
    /*
     * 다음의 경로와 일치하는 경우 미들웨어 실행:
     * - api (API 라우트)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico (파비콘 파일)
     * 제외:
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
