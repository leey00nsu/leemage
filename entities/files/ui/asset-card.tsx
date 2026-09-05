"use client";

import { ImageIcon, Layers } from "lucide-react";
import { useState } from "react";
import { AppCardLink } from "@/shared/ui/app/app-card-link";
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
  url?: string | null;
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
  url,
}: AssetCardProps) {
  const [failedUrls, setFailedUrls] = useState<string[]>([]);
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

  // Legacy uploads may have isImage=false despite an image MIME type.
  const effectiveIsImage = isImage || mimeType.startsWith("image/");

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
  const candidates = [...(variants || [])]
    .filter((v) => v.url)
    .sort((a, b) => {
      const rank = (v: ImageVariantData) =>
        v.label === thumbnailLabel
          ? 0
          : /^(webp|png|jpeg|jpg|avif|gif|svg|svg\+xml)$/i.test(v.format)
            ? 1
            : 2;
      return rank(a) - rank(b) || a.size - b.size;
    });
  const displayVariant = candidates.find((v) => !failedUrls.includes(v.url));
  const fallbackUrl = `/api/projects/${projectId}/files/${id}/preview`;
  const displayUrl =
    displayVariant?.url ||
    (url && !failedUrls.includes(url) ? url : null) ||
    (!failedUrls.includes(fallbackUrl) ? fallbackUrl : null);

  const format =
    mimeType && mimeType.includes("/") ? mimeType.split("/")[1] : "file";
  const resolution = displayVariant
    ? `${displayVariant.width}x${displayVariant.height}`
    : "—";

  return (
    <AppCardLink href={`/projects/${projectId}/files/${id}`} className="block">
      <AppAssetCard>
        <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative overflow-hidden flex items-center justify-center">
          {displayUrl ? (
            // Storage URLs can use configured custom domains; use native lazy loading.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={name}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
              onError={() =>
                setFailedUrls((previous) => [...previous, displayUrl])
              }
            />
          ) : (
            <ImageIcon
              role="img"
              aria-label={name}
              className="h-8 w-8 text-muted-foreground"
            />
          )}
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
    </AppCardLink>
  );
}
