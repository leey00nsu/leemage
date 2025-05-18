import Image from "next/image";
import { ImageVariantData } from "../model/types"; // 경로 수정

interface ImagePreviewProps {
  variant: ImageVariantData;
  altText: string;
}

export function ImagePreview({ variant, altText }: ImagePreviewProps) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
      <Image
        src={variant.url}
        alt={altText}
        width={variant.width}
        height={variant.height}
        className="object-contain" // 비율 유지
        // sizes="..." // 필요 시 추가
      />
    </div>
  );
}
