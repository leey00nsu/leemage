"use client";

import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ImageIcon, Layers } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { FileCard } from "../file-card";
import { VideoCard } from "../video/video-card";
import { ImageVariantData } from "../../model/types";
import { isVideoMimeType } from "@/shared/lib/file-utils";

interface ImageCardProps {
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

export function ImageCard({
  id,
  projectId,
  name,
  variants,
  thumbnailLabel = "thumbnail",
  priority = false,
  isImage = true,
  mimeType = "application/octet-stream",
  size = 0,
}: ImageCardProps) {
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
      <Card className="aspect-square flex items-center justify-center bg-muted">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </Card>
    );
  }

  return (
    <Link href={`/projects/${projectId}/files/${id}`} passHref>
      <Card className="overflow-hidden group relative aspect-square cursor-pointer">
        <Image
          src={displayVariant.url}
          alt={name}
          width={displayVariant.width}
          height={displayVariant.height}
          className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
          priority={priority}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
          <p className="text-white text-xs truncate mr-1" title={name}>
            {name}
          </p>
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0.5 whitespace-nowrap flex items-center"
          >
            <Layers className="h-3 w-3 mr-1" />
            {variants.length}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
