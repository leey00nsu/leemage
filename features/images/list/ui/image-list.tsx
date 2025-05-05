"use client";

import { Image as PrismaImageType } from "@/lib/generated/prisma";
import { Card } from "@/shared/ui/card";
import { ImageIcon, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/shared/ui/badge";

type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

type ImageWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};

interface ImageListProps {
  images: ImageWithVariants[];
}

function findVariantByLabel(
  variants: ImageVariantData[],
  label: string
): ImageVariantData | undefined {
  return variants.find((v) => v.label === label);
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
      {images.map((image) => {
        const displayVariant =
          findVariantByLabel(image.variants, "thumbnail") || image.variants[0];

        if (!displayVariant) {
          return (
            <Card
              key={image.id}
              className="aspect-square flex items-center justify-center bg-muted"
            >
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </Card>
          );
        }

        return (
          <Link
            key={image.id}
            href={`/projects/${image.projectId}/images/${image.id}`}
            passHref
          >
            <Card className="overflow-hidden group relative aspect-square cursor-pointer">
              <Image
                src={displayVariant.url}
                alt={image.name}
                width={displayVariant.width}
                height={displayVariant.height}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={images.indexOf(image) < 6}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center">
                <p
                  className="text-white text-xs truncate mr-1"
                  title={image.name}
                >
                  {image.name}
                </p>
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0.5 whitespace-nowrap flex items-center"
                >
                  <Layers className="h-3 w-3 mr-1" />
                  {image.variants.length}
                </Badge>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
