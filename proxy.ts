import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromEdge } from "@/lib/session";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // next-intl 미들웨어 실행
  const intlResponse = intlMiddleware(request);

  // next-intl이 실제 리디렉션을 수행하는 경우에만 early return
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  const { pathname } = request.nextUrl;

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
    pathWithoutLocale.startsWith(route)
  );

  // 로그인 페이지 경로 (locale 없는 경로)
  const loginPath = "/auth/login";

  // 세션 가져오기
  const session = await getSessionFromEdge(request);

  // 로그인 여부 확인
  const isLoggedIn = session?.isLoggedIn ?? false;

  // 1. 로그인 안 된 사용자가 보호된 경로 접근 시
  if (!isLoggedIn && isProtectedRoute) {
    // 현재 locale을 포함한 로그인 페이지로 리디렉션
    const redirectUrl = new URL(`/${currentLocale}${loginPath}`, request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. 로그인 된 사용자가 로그인 페이지 접근 시
  if (isLoggedIn && pathWithoutLocale === loginPath) {
    // 현재 locale을 포함한 프로젝트 페이지로 리디렉션
    return NextResponse.redirect(
      new URL(`/${currentLocale}/projects`, request.url)
    );
  }

  // 그 외의 경우 next-intl의 rewrite를 유지하면서 요청 계속 진행
  return intlResponse;
}

// proxy를 적용할 경로 설정
export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
  ],
};
