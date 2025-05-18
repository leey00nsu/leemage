"use client";

import { ImageVariantData } from "@/entities/images/model/types";
import { EmptyImageState } from "@/entities/images/ui/empty-image-state";
import { ImageCard } from "@/entities/images/ui/image-card";
import { ImageGrid } from "@/entities/images/ui/image-grid";
import { Image as PrismaImageType } from "@/lib/generated/prisma";

type ImageWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};

interface ImageListProps {
  images: ImageWithVariants[];
}

export function ImageList({ images }: ImageListProps) {
  if (!images || images.length === 0) {
    return (
      <EmptyImageState message="이 프로젝트에는 아직 이미지가 없습니다." />
    );
  }

  return (
    <ImageGrid>
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          id={image.id}
          projectId={image.projectId}
          name={image.name}
          variants={image.variants}
          priority={index < 6}
        />
      ))}
    </ImageGrid>
  );
}
