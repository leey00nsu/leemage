"use client";

import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";

interface FileActionsProps {
  projectId: string;
  fileId: string;
  url: string;
}

export function FileActions({ projectId, fileId, url }: FileActionsProps) {
  const t = useTranslations("FileActions");

  return (
    <div className="flex gap-2 pt-4">
      <Button asChild variant="outline" className="flex-1">
        <a
          href={`/api/projects/${projectId}/files/${fileId}/download`}
          download
        >
          <Download className="h-4 w-4 mr-2" />
          {t("download")}
        </a>
      </Button>
      <Button asChild variant="outline" className="flex-1">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4 mr-2" />
          {t("open")}
        </a>
      </Button>
    </div>
  );
}
