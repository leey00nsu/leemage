"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Folder } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { StorageProviderBadge } from "@/shared/ui/storage-provider-badge";
import { StorageProvider } from "@/lib/storage/types";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
  storageProvider?: StorageProvider | string;
}

export function ProjectCard({ id, name, description, storageProvider }: ProjectCardProps) {
  const t = useTranslations("ProjectCard");
  return (
    <Link href={`/projects/${id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <CardTitle className="text-lg truncate">{name}</CardTitle>
            </div>
            {storageProvider && (
              <StorageProviderBadge provider={storageProvider} showLabel={false} size="sm" />
            )}
          </div>
          <CardDescription className="line-clamp-2">
            {description || t("noDescription")}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
