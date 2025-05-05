"use client";

import { ImageUploadDialog } from "@/features/images/upload/ui/image-upload-dialog";
import { ImageList } from "@/features/images/list/ui/image-list";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { getProjectDetailsFn } from "@/features/projects/details/api";
import { Button } from "@/shared/ui/button";

interface ProjectDetailsWidgetProps {
  projectId: string;
}

export function ProjectDetailsWidget({ projectId }: ProjectDetailsWidgetProps) {
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId], // queryKey에 projectId 포함
    queryFn: () => getProjectDetailsFn(projectId),
    enabled: !!projectId, // projectId가 있을 때만 쿼리 실행
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>오류</AlertTitle>
        <AlertDescription>
          {error.message || "프로젝트 정보를 불러오는 중 오류가 발생했습니다."}
        </AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert>
        <AlertTitle>정보 없음</AlertTitle>
        <AlertDescription>프로젝트를 찾을 수 없습니다.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <DeleteProjectButton
          projectId={project.id}
          projectName={project.name}
        />
      </div>
      <p className="text-muted-foreground mb-6">{project.description}</p>

      <div className="flex justify-start mb-4">
        <ImageUploadDialog projectId={projectId}>
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" /> 이미지 업로드
          </Button>
        </ImageUploadDialog>
      </div>

      <ImageList images={project.images || []} />
    </div>
  );
}
