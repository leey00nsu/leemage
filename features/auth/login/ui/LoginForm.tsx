"use client"; // 클라이언트 컴포넌트로 지정

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, LoginFormValues } from "../model/schema"; // Zod 스키마 임포트
import { useRouter } from "next/navigation"; // 페이지 이동을 위해 추가
import { loginFn } from "../api"; // 분리된 API 함수 임포트

export function LoginForm() {
  const router = useRouter(); // useRouter 훅 사용
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 로그인 Mutation
  const mutation = useMutation({
    mutationFn: loginFn, // API 호출 함수 연결
    onSuccess: (data) => {
      // 로그인 성공 시 대시보드 페이지로 이동
      console.log("Login successful:", data);
      // TODO: 실제 세션/토큰 처리 로직 필요 (예: 쿠키 설정)
      router.push("/dashboard");
    },
    onError: (error) => {
      // 에러 처리 (폼 에러 표시는 아래 isError에서 처리)
      console.error("Login mutation error:", error);
    },
  });

  // 폼 제출 핸들러
  const onSubmit = (data: LoginFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>
          이메일과 비밀번호를 입력하여 로그인하세요.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {/* TanStack Query 에러 메시지 표시 */}
          {mutation.isError && (
            <p className="text-sm text-red-500 bg-red-100 p-2 rounded">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "로그인 처리 중 오류 발생"}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="root@example.com"
              {...register("email")}
              disabled={mutation.isPending} // 로딩 중 비활성화
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              disabled={mutation.isPending} // 로딩 중 비활성화
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "로그인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
