"use client";

import { FileUploadDialog } from "@/features/files/upload/ui/file-upload-dialog";
import { FileList } from "@/features/files/list/ui/file-list";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { Check, Copy, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { useGetProjectDetails } from "@/features/projects/details/model/get";
import { useTranslations } from "next-intl";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";

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
      <p className="text-muted-foreground mb-6">{project.description}</p>

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
