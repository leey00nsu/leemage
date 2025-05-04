"use client";

import { Image as ImageType } from "@/lib/generated/prisma";
import { Card } from "@/components/ui/card";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ImageListProps {
  images: ImageType[];
}

export function ImageList({ images }: ImageListProps) {
  if (!images || images.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center border-dashed">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          이 프로젝트에는 아직 이미지가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {images.map((image) => (
        <Link
          key={image.id}
          href={`/projects/${image.projectId}/images/${image.id}`}
          passHref
        >
          <Card className="overflow-hidden group relative aspect-square cursor-pointer">
            <Image
              src={image.url}
              alt={image.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16.6vw"
              priority={images.indexOf(image) < 6}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs truncate" title={image.name}>
                {image.name}
              </p>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
