import { ImageVariantData } from "../model/types";
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
  return (
    <div className="mt-6 pt-4 border-t">
      <h4 className="text-md font-semibold mb-3">{t("savedVersions")}</h4>
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
        <p className="text-xs text-muted-foreground">{t("noVersions")}</p>
      )}
    </div>
  );
}
