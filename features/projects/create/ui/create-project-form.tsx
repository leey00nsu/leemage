"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { createProjectSchema, CreateProjectFormValues } from "../model/schema";
import { useRouter } from "next/navigation";
import { createProjectFn } from "../api";

export function CreateProjectForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const mutation = useMutation({
    mutationFn: createProjectFn,
    onSuccess: (data) => {
      console.log("Project created successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Project creation mutation error:", error);
    },
  });

  const onSubmit = (data: CreateProjectFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-2xl">새 프로젝트 생성</CardTitle>
        <CardDescription>
          새로운 프로젝트의 이름과 설명을 입력하세요.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="grid gap-6">
          {mutation.isError && (
            <p className="text-sm text-red-500 bg-red-100 p-3 rounded">
              {mutation.error instanceof Error
                ? mutation.error.message
                : "알 수 없는 오류가 발생했습니다."}
            </p>
          )}
          <div className="grid gap-2">
            <Label htmlFor="name">프로젝트 이름</Label>
            <Input
              id="name"
              placeholder="예: 내 웹사이트 에셋"
              {...register("name")}
              disabled={mutation.isPending}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">설명 (선택 사항)</Label>
            <Textarea
              id="description"
              placeholder="프로젝트에 대한 간단한 설명을 입력하세요."
              {...register("description")}
              className="min-h-[100px]"
              disabled={mutation.isPending}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">
                {errors.description.message}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "생성 중..." : "프로젝트 생성"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
