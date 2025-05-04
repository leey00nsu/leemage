import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "유효한 이메일 주소를 입력해주세요." }),
  password: z.string().min(1, { message: "비밀번호를 입력해주세요." }), // 로그인 시에는 빈 값만 아니면 되도록 설정
});

export type LoginFormValues = z.infer<typeof loginSchema>;
