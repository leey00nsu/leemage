"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { Folder } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string | null;
}

export function ProjectCard({ id, name, description }: ProjectCardProps) {
  const t = useTranslations("ProjectCard");
  return (
    <Link href={`/projects/${id}`}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg truncate">{name}</CardTitle>
          </div>
          <CardDescription className="line-clamp-2">
            {description || t("noDescription")}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
