"use client";

import { useState, useEffect, useRef } from "react";
import { FileTypeIcon } from "@/entities/files/ui/file-type-icon";
import { isImageFile, isVideoFile } from "@/shared/lib/file-utils";
import { cn } from "@/shared/lib/utils";
import { Play } from "lucide-react";

export interface ImageDimensions {
  width: number;
  height: number;
}

interface FileThumbnailPreviewProps {
  file: File | null;
  maxSize?: number; // 미리보기 최대 크기 (px)
  className?: string;
  onDimensionsLoad?: (dimensions: ImageDimensions | null) => void;
}

export function FileThumbnailPreview({
  file,
  maxSize = 200,
  className,
  onDimensionsLoad,
}: FileThumbnailPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // 이전 URL 정리
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setDimensions(null);
    setIsVideo(false);
    onDimensionsLoad?.(null);

    if (!file) {
      return;
    }

    // 이미지 파일인 경우 미리보기 생성
    if (isImageFile(file)) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsVideo(false);
    }
    // 비디오 파일인 경우 썸네일 생성
    else if (isVideoFile(file)) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setIsVideo(true);
    }

    // 컴포넌트 언마운트 시 URL 정리
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const dims = { width: img.naturalWidth, height: img.naturalHeight };
    setDimensions(dims);
    onDimensionsLoad?.(dims);
    setIsLoading(false);
  };

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const dims = { width: video.videoWidth, height: video.videoHeight };
      setDimensions(dims);
      onDimensionsLoad?.(dims);
      // 1초 지점으로 이동하여 썸네일 표시
      video.currentTime = 1;
    }
    setIsLoading(false);
  };

  if (!file) {
    return null;
  }

  const isImageType = isImageFile(file);

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className="relative flex items-center justify-center rounded-lg border bg-muted/30 p-4"
        style={{ maxWidth: maxSize, maxHeight: maxSize }}
      >
        {isImageType && previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded"
            style={{ maxWidth: maxSize - 32, maxHeight: maxSize - 32 }}
            onLoad={handleImageLoad}
            onError={() => {
              setPreviewUrl(null);
              setIsLoading(false);
            }}
          />
        ) : isVideo && previewUrl ? (
          <>
            <video
              ref={videoRef}
              src={previewUrl}
              className="max-w-full max-h-full object-contain rounded"
              style={{ maxWidth: maxSize - 32, maxHeight: maxSize - 32 }}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onError={() => {
                setPreviewUrl(null);
                setIsLoading(false);
              }}
              muted
              playsInline
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-2">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          </>
        ) : (
          <FileTypeIcon mimeType={file.type} size={64} />
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
      {dimensions && (
        <span className="text-xs text-muted-foreground">
          {dimensions.width} × {dimensions.height} px
        </span>
      )}
    </div>
  );
}
