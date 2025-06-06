"use client"; // next/image 사용 및 클라이언트 인터랙션 가능성을 위해

import { ImageWithVariants } from "@/entities/images/model/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ImageIcon } from "lucide-react";
import { findVariantByLabel } from "@/shared/lib/image-utils";
import { ImagePreview } from "@/entities/images/ui/image-preview";
import { ImageInfo } from "@/entities/images/ui/image-info";
import { DeleteImageDialog } from "@/features/images/delete/ui/delete-image-dialog";
import { useTranslations } from "next-intl";
import { ImageVariantList } from "@/entities/images/ui/image-variant-list";

export function ImageDetailsWidget({ image }: { image: ImageWithVariants }) {
  const displayVariant =
    findVariantByLabel(image.variants, "original") || image.variants[0];
  const t = useTranslations("ImageDetailsWidget");

  if (!displayVariant) {
    return (
      <Card className="container mx-auto py-8 px-4">
        <CardHeader>
          <CardTitle>{t("noInfoTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t("noInfoDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="truncate " title={image.name}>
              {image.name}
            </CardTitle>
            <Badge variant="secondary" className="w-fit mt-1">
              {displayVariant.format.toUpperCase()}
            </Badge>
          </div>
          <DeleteImageDialog image={image} />
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <ImagePreview variant={displayVariant} altText={image.name} />
            <div className="space-y-4">
              <ImageInfo image={image} displayVariant={displayVariant} />
              <ImageVariantList
                variants={image.variants}
                displayVariantLabel={displayVariant.label}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
