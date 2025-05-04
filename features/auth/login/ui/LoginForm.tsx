"use client"; // 클라이언트 컴포넌트로 지정

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

export function LoginForm() {
  const router = useRouter(); // useRouter 훅 사용
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError, // 서버 측 에러 처리를 위해 다시 사용
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // 서버에서 받은 에러 메시지를 폼의 루트 에러로 설정
        setError("root", {
          type: "manual",
          message: errorData.message || "로그인에 실패했습니다.",
        });
        return;
      }

      // 로그인 성공 시 대시보드 페이지로 이동 (예시)
      console.log("Login successful, redirecting...");
      router.push("/dashboard"); // 로그인 성공 후 이동할 경로
    } catch (error) {
      console.error("Login form submission error:", error);
      setError("root", {
        type: "manual",
        message: "로그인 요청 중 오류가 발생했습니다.",
      });
    }
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
          {/* 서버 측 루트 에러 메시지 표시 */}
          {errors.root && (
            <p className="text-sm text-red-500 bg-red-100 p-2 rounded">
              {errors.root.message}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="root@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
