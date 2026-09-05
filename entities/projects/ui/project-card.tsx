"use client";

import { AppCardLink } from "@/shared/ui/app/app-card-link";
import { useTranslations } from "next-intl";
import { StorageProvider } from "@/lib/storage/types";
import { AppProjectCard } from "@/shared/ui/app/app-project-card";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  storageProvider?: StorageProvider | string;
  fileCount?: number;
  updatedAt?: string | Date;
  lastUploadedAt?: string | null;
}

export function ProjectCard({
  id,
  name,
  description,
  storageProvider,
  fileCount,
  updatedAt,
  lastUploadedAt,
}: ProjectCardProps) {
  const t = useTranslations("ProjectCard");

  return (
    <AppCardLink href={`/projects/${id}`} className="block h-full">
      <AppProjectCard
        className="h-full"
        name={name}
        description={description || t("noDescription")}
        storageProvider={storageProvider}
        fileCount={fileCount}
        updatedAt={updatedAt}
        lastUploadedAt={lastUploadedAt}
      />
    </AppCardLink>
  );
}
