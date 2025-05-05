"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectsFn } from "../api";
import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import Link from "next/link";
import { AlertCircle, Folder } from "lucide-react";

export function ProjectList() {
  const {
    data: projects,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjectsFn,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border rounded-lg p-8 text-center border-destructive bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-semibold">
          프로젝트 목록을 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-sm text-destructive/80">
          {(error as Error)?.message || "알 수 없는 오류"}
        </p>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center border-dashed">
        <p className="text-muted-foreground">
          아직 생성된 프로젝트가 없습니다.
          <br />
          &apos;새 프로젝트 생성&apos; 버튼을 클릭하여 시작하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <Link href={`/projects/${project.id}`} key={project.id}>
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Folder className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-lg truncate">
                  {project.name}
                </CardTitle>
              </div>
              <CardDescription className="line-clamp-2">
                {project.description || "설명이 없습니다."}
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
