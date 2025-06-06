import { ImageVariantData, ImageWithVariants } from "../model/types"; // 경로 수정
import { formatBytes } from "@/shared/lib/image-utils"; // 경로 수정
import { Ruler, FileBox, Calendar, Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "next-intl";
import { FormattedDate } from "@/shared/ui/formatted-date";

interface ImageInfoProps {
  image: ImageWithVariants;
  displayVariant: ImageVariantData;
}

export function ImageInfo({ image, displayVariant }: ImageInfoProps) {
  const t = useTranslations("ImageInfo");
  const tListItem = useTranslations("ImageVariantListItem");

  const { copied, handleCopy } = useCopyToClipboard({
    text: displayVariant.url,
    onSuccessCallback: () => {
      toast.success(tListItem("urlCopied"));
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">{t("details")}</h3>
      <div className="flex items-center text-sm text-muted-foreground">
        <Ruler className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("sizeLabel")} {displayVariant.width} x {displayVariant.height} px
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <FileBox className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("fileLabel")} {displayVariant.format.toUpperCase()} (
          {formatBytes(displayVariant.size)})
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("uploadDateLabel")}{" "}
          <FormattedDate date={new Date(image.createdAt)} />
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("lastModifiedDateLabel")}{" "}
          <FormattedDate date={new Date(image.updatedAt)} />
        </span>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div
          onClick={handleCopy}
          className="flex items-center justify-between gap-2 cursor-pointer"
        >
          <p className="text-xs text-muted-foreground break-all">
            <span className="font-medium text-foreground">
              {t("urlLabel", { label: displayVariant.label })}
            </span>{" "}
            {displayVariant.url}
          </p>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
