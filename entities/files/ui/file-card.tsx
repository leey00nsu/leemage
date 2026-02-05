"use client";

import { Link } from "@/i18n/navigation";
import { FileTypeIcon } from "./file-type-icon";
import { formatFileSize } from "@/shared/lib/file-utils";
import { AppAssetCard } from "@/shared/ui/app/app-asset-card";

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
    <Link href={`/projects/${projectId}/files/${id}`} className="block">
      <AppAssetCard>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FileTypeIcon mimeType={mimeType} size={56} />
        </div>
        <div className="p-3">
          <div className="text-sm font-medium text-slate-900 dark:text-white truncate" title={name}>
            {name}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="uppercase">{mimeType.split("/")[1] ?? "file"}</span>
            <span>{formatFileSize(size)}</span>
          </div>
        </div>
      </AppAssetCard>
    </Link>
  );
}
