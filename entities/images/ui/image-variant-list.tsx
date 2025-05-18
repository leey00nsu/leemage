import { ImageVariantData } from "../model/types";
import { ImageVariantListItem } from "./image-variant-list-item";

interface ImageVariantListProps {
  variants: ImageVariantData[];
  displayVariantLabel: string;
}

export function ImageVariantList({
  variants,
  displayVariantLabel,
}: ImageVariantListProps) {
  return (
    <div className="mt-6 pt-4 border-t">
      <h4 className="text-md font-semibold mb-3">저장된 버전</h4>
      {variants && variants.length > 0 ? (
        <ul className="space-y-2 text-xs">
          {variants.map((variant, index) => (
            <ImageVariantListItem
              key={index}
              variant={variant}
              isDisplayed={variant.label === displayVariantLabel}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          저장된 버전 정보가 없습니다.
        </p>
      )}
    </div>
  );
}
