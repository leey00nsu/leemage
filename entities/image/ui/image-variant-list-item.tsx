import { ImageVariantData } from "../model/types"; // 경로 수정
import { formatBytes } from "@/shared/lib/image-utils"; // 경로 수정
import { CopyImageUrlButton } from "@/features/images/copy-url/ui/copy-image-url-button"; // 경로 수정

interface ImageVariantListItemProps {
  variant: ImageVariantData;
  isDisplayed: boolean; // 현재 메인으로 표시되는 버전인지 여부
}

export function ImageVariantListItem({
  variant,
  isDisplayed,
}: ImageVariantListItemProps) {
  return (
    <li className="p-2 border rounded-md bg-muted/50 space-y-1">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-medium ${isDisplayed ? "text-primary" : ""}`}>
          {variant.label.toUpperCase()} ({variant.format.toUpperCase()})
        </span>
        <span className="text-muted-foreground">
          {variant.width}x{variant.height} px
        </span>
      </div>
      <div className="flex justify-between items-center text-muted-foreground">
        <span>{formatBytes(variant.size)}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span
          className="break-all text-muted-foreground flex-1"
          title={variant.url}
        >
          {variant.url}
        </span>
        <CopyImageUrlButton url={variant.url} />
      </div>
    </li>
  );
}
