import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "@/lib/session";

export async function POST() {
  try {
    // 세션 가져오기
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );

    // 세션 파기
    session.destroy();

    return NextResponse.json({ ok: true, message: "로그아웃 성공" });
  } catch (error) {
    console.error("Logout API error:", error);
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
