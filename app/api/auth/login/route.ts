import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/features/auth/login/model/schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. 요청 본문 유효성 검사 (Zod 스키마 사용)
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
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
    const rootPassword = process.env.ROOT_USER_PASSWORD;

    if (!rootEmail || !rootPassword) {
      console.error(
        "Error: ROOT_USER_EMAIL or ROOT_USER_PASSWORD environment variables not set."
      );
      return NextResponse.json({ message: "서버 설정 오류" }, { status: 500 });
    }

    // 3. 입력된 정보와 환경 변수 정보 비교
    if (email === rootEmail && password === rootPassword) {
      // 로그인 성공
      // TODO: 세션 관리 구현 (예: 쿠키 설정 또는 JWT 발급)
      // 예시: 간단한 성공 메시지 반환
      return NextResponse.json({ message: "로그인 성공" }, { status: 200 });
    } else {
      // 로그인 실패
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
