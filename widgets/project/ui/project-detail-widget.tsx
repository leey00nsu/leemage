"use client";

import { FileUploadDialog } from "@/features/files/upload/ui/file-upload-dialog";
import { FileList } from "@/features/files/list/ui/file-list";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { EditProjectDialog } from "@/features/projects/edit/ui/edit-project-dialog";
import { Check, Copy, Upload, Pencil, HardDrive, FileText } from "lucide-react";
import { ProjectDetailSkeleton } from "./project-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { useGetProjectDetails } from "@/features/projects/details/model/get";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { StorageProviderBadge } from "@/shared/ui/storage-provider-badge";
import { formatBytes } from "@/shared/lib/format-bytes";

interface ProjectDetailsWidgetProps {
  projectId: string;
}

export function ProjectDetailsWidget({ projectId }: ProjectDetailsWidgetProps) {
  const { data: project, isLoading, error } = useGetProjectDetails(projectId);
  const t = useTranslations("ProjectDetailsWidget");

  const { copied, handleCopy } = useCopyToClipboard({
    text: project?.id || "",
    onSuccessCallback: () => {
      toast.success(t("idCopied"));
    },
  });

  if (isLoading) {
    return <ProjectDetailSkeleton />;
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

  // 프로젝트 스토리지 사용량 계산 (원본 + variants 포함)
  const totalBytes = project.files?.reduce((sum, file) => {
    let fileTotal = file.size || 0;
    if (Array.isArray(file.variants)) {
      fileTotal += file.variants.reduce((vSum, v) => vSum + (v.size || 0), 0);
    }
    return sum + fileTotal;
  }, 0) || 0;
  const fileCount = project.files?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">{project.name}</h1>
        <div className="flex gap-2">
          <EditProjectDialog
            projectId={project.id}
            currentName={project.name}
            currentDescription={project.description}
          >
            <Button variant="outline" size="sm">
              <Pencil className="mr-2 h-4 w-4" /> {t("editButton")}
            </Button>
          </EditProjectDialog>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
        </div>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <div
          onClick={handleCopy}
          className="inline-flex items-center gap-2 cursor-pointer"
        >
          <span className="text-xs text-muted-foreground break-all ">
            <span className="font-medium text-foreground">{t("idLabel")}</span>{" "}
            {project.id}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        {project.storageProvider && (
          <StorageProviderBadge provider={project.storageProvider} />
        )}
      </div>
      <p className="text-muted-foreground mb-6">{project.description}</p>

      {/* 프로젝트 스토리지 사용량 */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground border rounded-lg p-3">
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-4 w-4" />
          <span>{t("storageUsage")}:</span>
          <span className="font-medium text-foreground">{formatBytes(totalBytes)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>{fileCount} {t("files")}</span>
        </div>
      </div>

      <div className="flex justify-start mb-4">
        <FileUploadDialog projectId={projectId}>
          <Button size="sm">
            <Upload className="mr-2 h-4 w-4" /> {t("uploadImageButton")}
          </Button>
        </FileUploadDialog>
      </div>

      <FileList files={project.files || []} />
    </div>
  );
}
