import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/login/model/schema";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";
import { authLogger, maskEmail } from "@/lib/logging/secure-logger";
import { compare } from "bcryptjs";

function decodeBase64Url(value: string): string | null {
  const normalized = value.trim().replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  try {
    return Buffer.from(normalized + padding, "base64").toString("utf8");
  } catch {
    return null;
  }
}

export async function loginHandler(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  
  try {
    const body = await req.json();

    // 1. 요청 본문 유효성 검사 (Zod 스키마 사용)
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      authLogger.security({
        type: "VALIDATION_FAILURE",
        ip,
        details: { reason: "잘못된 요청 형식" },
      });
      return NextResponse.json(
        {
          message: "잘못된 요청 형식입니다.",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // 2. 환경 변수에서 루트 사용자 정보 가져오기
    const rootEmail = process.env.ROOT_USER_EMAIL;
    const rootPasswordHashB64 = process.env.ROOT_USER_PASSWORD_HASH_B64;
    const rootPasswordHash = rootPasswordHashB64
      ? decodeBase64Url(rootPasswordHashB64)
      : null;

    if (rootPasswordHashB64 && !rootPasswordHash) {
      authLogger.error("ROOT_USER_PASSWORD_HASH_B64 is invalid");
    }

    if (!rootEmail || !rootPasswordHashB64 || !rootPasswordHash) {
      authLogger.error(
        "ROOT_USER_EMAIL or ROOT_USER_PASSWORD_HASH_B64 environment variables not set"
      );
      return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
    }

    // 3. 입력된 정보와 환경 변수 정보 비교
    const isPasswordValid = await compare(password, rootPasswordHash);
    const emailMatchExact = email === rootEmail;
    const emailMatchNormalized =
      email.trim().toLowerCase() === rootEmail.trim().toLowerCase();
    if (emailMatchExact && isPasswordValid) {
      // 로그인 성공
      const session = await getIronSession<SessionData>(
        await cookies(),
        sessionOptions
      );
      session.isLoggedIn = true;
      session.username = email;
      await session.save();

      authLogger.security({
        type: "AUTH_SUCCESS",
        ip,
        userId: email,
        details: { email: maskEmail(email) },
      });

      return NextResponse.json(
        { message: "로그인 성공", user: { username: email } },
        { status: 200 }
      );
    } else {
      authLogger.info("LOGIN_DEBUG", {
        emailMatchExact,
        emailMatchNormalized,
        passwordMatch: isPasswordValid,
        inputEmailLen: email.length,
        rootEmailLen: rootEmail.length,
        hashLen: rootPasswordHash.length,
        hashPrefix: rootPasswordHash.slice(0, 4),
      });
      // 로그인 실패
      authLogger.security({
        type: "AUTH_FAILURE",
        ip,
        details: { reason: "이메일 또는 비밀번호 불일치", email: maskEmail(email) },
      });
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    authLogger.error("Login API error", { error: String(error) });
    return NextResponse.json(
      { message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function logoutHandler() {
  try {
    // 세션 가져오기
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    const userId = session.username;

    // 세션 파기
    session.destroy();

    authLogger.info("User logged out", { userId: userId ? maskEmail(userId) : "unknown" });

    return NextResponse.json({ ok: true, message: "로그아웃 성공" });
  } catch (error) {
    authLogger.error("Logout API error", { error: String(error) });
    const errorMessage =
      error instanceof Error
        ? error.message
        : "로그아웃 처리 중 알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { ok: false, message: errorMessage },
      { status: 500 }
    );
  }
}
