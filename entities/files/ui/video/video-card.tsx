"use client";

import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Video, Play } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ImageVariantData } from "../../model/types";
import { formatFileSize } from "@/shared/lib/file-utils";

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
    <Link href={`/projects/${projectId}/files/${id}`} passHref>
      <Card className="overflow-hidden group relative aspect-square cursor-pointer">
        {thumbnail ? (
          <>
            <Image
              src={thumbnail.url}
              alt={name}
              width={thumbnail.width}
              height={thumbnail.height}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
            {/* Play icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-3 group-hover:bg-black/70 transition-colors">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Video className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
          <p className="text-white text-xs truncate mr-1" title={name}>
            {name}
          </p>
          <Badge
            variant="secondary"
            className="text-xs px-1.5 py-0.5 whitespace-nowrap flex items-center"
          >
            <Video className="h-3 w-3 mr-1" />
            {formatFileSize(size)}
          </Badge>
        </div>
      </Card>
    </Link>
  );
}
