import Image from "next/image";
import { ImageVariantData } from "../model/types"; // 경로 수정

interface ImagePreviewProps {
  variant: ImageVariantData;
  altText: string;
}

export function ImagePreview({ variant, altText }: ImagePreviewProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border ">
      <Image
        src={variant.url}
        alt={altText}
        width={variant.width}
        height={variant.height}
        className="object-contain w-full h-full"
      />
    </div>
  );
}
