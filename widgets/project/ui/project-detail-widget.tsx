"use client";

import { ImageUploadDialog } from "@/features/images/upload/ui/image-upload-dialog";
import { ImageList } from "@/features/images/list/ui/image-list";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { useGetProjectDetails } from "@/features/projects/details/model/get";
import { useTranslations } from "next-intl";

interface ProjectDetailsWidgetProps {
  projectId: string;
}

export function ProjectDetailsWidget({ projectId }: ProjectDetailsWidgetProps) {
  const { data: project, isLoading, error } = useGetProjectDetails(projectId);
  const t = useTranslations("ProjectDetailsWidget");

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
        <AlertTitle>{t("errorTitle")}</AlertTitle>
        <AlertDescription>
          {error.message || t("fetchErrorDescription")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert>
        <AlertTitle>{t("notFoundTitle")}</AlertTitle>
        <AlertDescription>{t("notFoundDescription")}</AlertDescription>
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
            <Upload className="mr-2 h-4 w-4" /> {t("uploadImageButton")}
          </Button>
        </ImageUploadDialog>
      </div>

      <ImageList images={project.images || []} />
    </div>
  );
}
