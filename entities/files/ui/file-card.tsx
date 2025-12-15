"use client";

import { Card } from "@/shared/ui/card";
import { Link } from "@/i18n/navigation";
import { FileTypeIcon } from "./file-type-icon";
import { formatFileSize } from "@/shared/lib/file-utils";

interface FileCardProps {
  id: string;
  projectId: string;
  name: string;
  mimeType: string;
  size: number;
}

export function FileCard({
  id,
  projectId,
  name,
  mimeType,
  size,
}: FileCardProps) {
  return (
    <Link href={`/projects/${projectId}/files/${id}`} passHref>
      <Card className="overflow-hidden group relative aspect-square cursor-pointer flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors">
        <FileTypeIcon mimeType={mimeType} size={48} className="mb-2" />
        <p
          className="text-sm font-medium truncate max-w-[90%] px-2"
          title={name}
        >
          {name}
        </p>
        {size > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatFileSize(size)}
          </p>
        )}
      </Card>
    </Link>
  );
}
