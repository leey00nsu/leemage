import { ImageVariantData } from "../../model/types";
import { ImageVariantListItem } from "./image-variant-list-item";
import { useTranslations } from "next-intl";

interface ImageVariantListProps {
  variants: ImageVariantData[];
  displayVariantLabel: string;
}

export function ImageVariantList({
  variants,
  displayVariantLabel,
}: ImageVariantListProps) {
  const t = useTranslations("ImageVariantList");

  // 크기(width) 내림차순으로 정렬 (가장 큰 해상도가 원본)
  const sortedVariants = [...variants].sort((a, b) => {
    // thumbnail은 항상 맨 뒤로
    if (a.label === "thumbnail") return 1;
    if (b.label === "thumbnail") return -1;
    return b.width - a.width;
  });

  return (
    <div className="mt-6 pt-4 border-t">
      <h4 className="text-md font-semibold mb-3">{t("savedVersions")}</h4>
      {sortedVariants && sortedVariants.length > 0 ? (
        <ul className="space-y-2 text-xs">
          {sortedVariants.map((variant, index) => (
            <ImageVariantListItem
              key={index}
              variant={variant}
              isDisplayed={variant.label === displayVariantLabel}
            />
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noVersions")}</p>
      )}
    </div>
  );
}
