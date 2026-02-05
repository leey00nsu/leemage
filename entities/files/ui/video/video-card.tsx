"use client";

import { Video, Play } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ImageVariantData } from "../../model/types";
import { formatFileSize } from "@/shared/lib/file-utils";
import { AppAssetCard } from "@/shared/ui/app/app-asset-card";

interface VideoCardProps {
  id: string;
  projectId: string;
  name: string;
  variants: ImageVariantData[];
  mimeType: string;
  size: number;
}

export function VideoCard({
  id,
  projectId,
  name,
  variants,
  mimeType,
  size,
}: VideoCardProps) {
  // 썸네일 찾기
  const thumbnail = variants?.find((v) => v.label === "thumbnail");

  return (
    <Link href={`/projects/${projectId}/files/${id}`} className="block">
      <AppAssetCard>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center">
          {thumbnail ? (
            <>
              <Image
                src={thumbnail.url}
                alt={name}
                width={thumbnail.width}
                height={thumbnail.height}
                className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/50 rounded-full p-3 group-hover:bg-black/70 transition-colors">
                  <Play className="h-8 w-8 text-white fill-white" />
                </div>
              </div>
            </>
          ) : (
            <Video className="h-12 w-12 text-muted-foreground" />
          )}
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-white uppercase">
            video
          </div>
        </div>
        <div className="p-3">
          <div className="text-sm font-medium text-slate-900 dark:text-white truncate" title={name}>
            {name}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="uppercase">{mimeType.split("/")[1] ?? "video"}</span>
            <span>{formatFileSize(size)}</span>
          </div>
        </div>
      </AppAssetCard>
    </Link>
  );
}
