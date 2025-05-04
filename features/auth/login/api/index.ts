import { LoginFormValues } from "../model/schema";

// 로그인 API 응답 타입 (예시 - 실제 API 응답에 맞게 조정 필요)
interface LoginResponse {
  message: string;
  // token?: string; // 예: JWT 토큰
}

export const loginFn = async (
  data: LoginFormValues
): Promise<LoginResponse> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "로그인에 실패했습니다.");
  }

  return response.json();
};
