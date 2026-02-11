"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { AppCard } from "@/shared/ui/app/app-card";
import {
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { createLoginSchema, LoginFormValues } from "../model/schema";
import { useRouter } from "@/i18n/navigation";
import { login } from "../api/login";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations("LoginForm");
  const tValidation = useTranslations("Validation");

  // i18n 스키마 생성
  const schema = useMemo(
    () => createLoginSchema((key) => tValidation(key)),
    [tValidation]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 로그인 Mutation
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      console.log("Login successful:", data);
      router.replace("/projects");
      router.refresh();
    },
    onError: (error) => {
      console.error("Login mutation error:", error);
    },
  });

  // 폼 제출 핸들러
  const onSubmit = (data: LoginFormValues) => {
    mutation.mutate(data);
  };

  return (
    <AppCard className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-4">
          {/* TanStack Query 에러 메시지 표시 */}
          {mutation.isError && (
            <p className="text-sm text-red-500 bg-red-100 p-2 rounded">
              {mutation.error instanceof Error
                ? mutation.error.message
                : t("loginError")}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              {...register("email")}
              disabled={mutation.isPending}
            />
            {errors.email && (
              <p className="text-xs text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              disabled={mutation.isPending}
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
        </CardContent>
        {/* CardFooter에 상단 마진(mt-6) 추가 */}
        <CardFooter className="mt-6">
          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("loggingInButton") : t("loginButton")}
          </Button>
        </CardFooter>
      </form>
    </AppCard>
  );
}
