import {
  getIronSession as getIronSessionDefault,
  IronSession,
} from "iron-session";
import { getIronSession as getIronSessionEdge } from "iron-session";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

// 세션에 저장될 데이터 구조 정의
interface SessionPayload {
  username?: string;
  isLoggedIn?: boolean;
}

// 세션 데이터 인터페이스 정의 (IronSession 확장)
export interface SessionData extends IronSession<SessionPayload> {
  additionalData?: never;
}

// 세션 옵션 설정
export const sessionOptions = {
  cookieName: process.env.IRON_SESSION_COOKIE_NAME || "leemage_session",
  password:
    process.env.IRON_SESSION_PASSWORD ||
    "complex_password_at_least_32_characters_long", // 환경 변수 사용 권장
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  },
  ttl: 60 * 60 * 24 * 7, // 7일
};

/**
 * 서버 컴포넌트 또는 API 라우트에서 세션 데이터를 가져옵니다.
 */
export async function getSessionDefault(): Promise<SessionData> {
  const session = await getIronSessionDefault<SessionPayload>(
    await cookies(),
    sessionOptions
  );
  return session as SessionData;
}

/**
 * 미들웨어 (Edge Runtime)에서 세션 데이터를 가져옵니다.
 */
export async function getSessionFromEdge(
  req: NextRequest
): Promise<SessionData> {
  const session = await getIronSessionEdge<SessionPayload>(
    req,
    new Response(),
    sessionOptions
  );
  return session as SessionData;
}
