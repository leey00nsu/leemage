import { z } from "zod";

// 번역 함수 타입
type TranslationFunction = (key: string) => string;

// 스키마 팩토리 함수 - 번역 함수를 받아서 스키마 생성
export const createLoginSchema = (t: TranslationFunction) =>
  z.object({
    email: z.string().email({ message: t("email.invalid") }),
    password: z.string().min(1, { message: t("password.required") }),
  });

// 기본 스키마 (서버 사이드 또는 폴백용)
export const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
