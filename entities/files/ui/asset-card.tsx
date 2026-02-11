"use client";

import { ImageIcon, Layers } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FileCard } from "./file-card";
import { VideoCard } from "./video/video-card";
import { ImageVariantData } from "../model/types";
import { isVideoMimeType } from "@/shared/lib/file-utils";
import { AppAssetCard } from "@/shared/ui/app/app-asset-card";
import { formatFileSize } from "@/shared/lib/file-utils";

interface AssetCardProps {
  id: string;
  projectId: string;
  name: string;
  variants: ImageVariantData[];
  thumbnailLabel?: string;
  priority?: boolean;
  isImage?: boolean;
  mimeType?: string;
  size?: number;
}

export function AssetCard({
  id,
  projectId,
  name,
  variants,
  thumbnailLabel = "thumbnail",
  priority = false,
  isImage = true,
  mimeType = "application/octet-stream",
  size = 0,
}: AssetCardProps) {
  // 비디오 파일인 경우 VideoCard로 위임
  if (isVideoMimeType(mimeType)) {
    return (
      <VideoCard
        id={id}
        projectId={projectId}
        name={name}
        variants={variants}
        mimeType={mimeType}
        size={size}
      />
    );
  }

  // variants가 비어있으면 비이미지로 처리 (기존 데이터 호환)
  const hasVariants = variants && variants.length > 0;
  const effectiveIsImage = isImage && hasVariants;

  // 비이미지 파일인 경우 FileCard로 위임
  if (!effectiveIsImage) {
    return (
      <FileCard
        id={id}
        projectId={projectId}
        name={name}
        mimeType={mimeType}
        size={size}
      />
    );
  }

  // 이미지 파일인 경우
  const displayVariant =
    variants.find((v) => v.label === thumbnailLabel) || variants[0];

  if (!displayVariant) {
    return (
      <AppAssetCard className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </AppAssetCard>
    );
  }

  const format =
    mimeType && mimeType.includes("/") ? mimeType.split("/")[1] : "file";
  const resolution = `${displayVariant.width}x${displayVariant.height}`;

  return (
    <Link href={`/projects/${projectId}/files/${id}`} className="block">
      <AppAssetCard>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center">
          <Image
            src={displayVariant.url}
            alt={name}
            width={displayVariant.width}
            height={displayVariant.height}
            className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
            priority={priority}
          />
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] font-mono text-white uppercase">
            {format}
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className="text-sm font-medium text-slate-900 dark:text-white truncate"
              title={name}
            >
              {name}
            </h3>
            <span className="text-slate-400">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>{resolution}</span>
            <span>{formatFileSize(size)}</span>
          </div>
        </div>
      </AppAssetCard>
    </Link>
  );
}
