"use client";

import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsFn } from "@/features/projects/details/api";
import { Skeleton } from "@/shared/ui/skeleton";
import { AlertCircle, Upload } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ImageList } from "@/features/images/list/ui/image-list";
import { ImageUploadDialog } from "@/features/images/upload/ui/image-upload-dialog";

interface ProjectDetailsWidgetProps {
  projectId: string;
}

export function ProjectDetailsWidget({ projectId }: ProjectDetailsWidgetProps) {
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["project", projectId], // queryKey에 projectId 포함
    queryFn: () => getProjectDetailsFn(projectId),
    enabled: !!projectId, // projectId가 있을 때만 쿼리 실행
  });

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-8">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border rounded-lg p-8 text-center border-destructive bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-destructive font-semibold">
          프로젝트 정보를 불러오는 중 오류가 발생했습니다.
        </p>
        <p className="text-sm text-destructive/80">
          {(error as Error)?.message || "알 수 없는 오류"}
        </p>
      </div>
    );
  }

  if (!project) {
    // 쿼리는 성공했지만 데이터가 없는 경우 (API에서 404 반환)
    return (
      <div className="border rounded-lg p-8 text-center border-dashed">
        <p className="text-muted-foreground">프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">
          {project.description || "설명이 없습니다."}
        </p>
      </div>

      <div className="flex justify-start mb-4">
        {/* 이미지 업로드 버튼을 DialogTrigger로 사용 */}
        <ImageUploadDialog projectId={projectId}>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> 이미지 업로드
          </Button>
        </ImageUploadDialog>
      </div>

      {/* 이미지 목록 표시 */}
      <ImageList images={project.images} />
    </div>
  );
}
