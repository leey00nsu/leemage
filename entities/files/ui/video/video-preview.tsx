"use client";

import { useState } from "react";
import { Video, ExternalLink } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";
import { ImageVariantData } from "../../model/types";

interface VideoPreviewProps {
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  videoUrl: string;
  altText: string;
}

export function VideoPreview({
  thumbnailUrl,
  videoUrl,
  altText,
}: VideoPreviewProps) {
  const t = useTranslations("FileDetail");
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  const handleOpenInNewTab = () => {
    window.open(videoUrl, "_blank", "noopener,noreferrer");
  };

  // 비디오 URL이 있으면 비디오 플레이어 표시
  if (videoUrl) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
          <video
            key={videoUrl}
            src={videoUrl}
            aria-label={altText}
            playsInline
            onError={() => setFailedUrl(videoUrl)}
            onLoadedData={() => setFailedUrl(null)}
            poster={thumbnailUrl}
            controls
            className="w-full h-full object-contain"
            preload="metadata"
          >
            {altText}
          </video>
          {/* 새 탭에서 열기 버튼 */}
          <div className="absolute top-2 right-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenInNewTab}
              className="opacity-70 hover:opacity-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {t("openInNewTab") || "Open in new tab"}
            </Button>
          </div>
        </div>
        {failedUrl === videoUrl && (
          <p role="alert" className="text-sm text-destructive">
            {t("videoPlaybackError")}
          </p>
        )}
      </div>
    );
  }

  // 비디오 URL이 없으면 아이콘 표시
  return (
    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <Video className="h-16 w-16 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("videoUrlMissing")}</p>
      </div>
    </div>
  );
}

/**
 * Helper function to extract video preview props from file data
 */
export function getVideoPreviewProps(
  variants: ImageVariantData[] | undefined,
  videoUrl: string,
  fileName: string,
): VideoPreviewProps {
  const thumbnail = variants?.find((v) => v.label === "thumbnail");

  return {
    thumbnailUrl: thumbnail?.url,
    thumbnailWidth: thumbnail?.width,
    thumbnailHeight: thumbnail?.height,
    videoUrl:
      videoUrl ||
      variants?.find(
        (v) =>
          v.label !== "thumbnail" &&
          /^(mp4|webm|quicktime|mov|m4v|x-m4v|ogg|x-msvideo|avi|x-matroska|mkv|mpeg)$/i.test(
            v.format,
          ),
      )?.url ||
      "",
    altText: fileName,
  };
}
