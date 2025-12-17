"use client";

import { formatFileSize } from "@/shared/lib/file-utils";
import { FileBox, Calendar, Check, Copy, FileType, Ruler } from "lucide-react";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { FormattedDate } from "@/shared/ui/formatted-date";
import { useTranslations } from "next-intl";

interface FileInfoProps {
  name: string;
  size: number;
  mimeType: string;
  createdAt: Date;
  updatedAt: Date;
  url?: string | null;
  resolution?: { width: number; height: number };
}

export function FileInfo({
  name,
  size,
  mimeType,
  createdAt,
  updatedAt,
  url,
  resolution,
}: FileInfoProps) {
  const t = useTranslations("FileInfo");
  const tCopy = useTranslations("ImageVariantListItem");

  const { copied, handleCopy } = useCopyToClipboard({
    text: url || "",
    onSuccessCallback: () => {
      toast.success(tCopy("urlCopied"));
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">{t("title")}</h3>
      {resolution && (
        <div className="flex items-center text-sm text-muted-foreground">
          <Ruler className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            {t("resolution")}: {resolution.width} × {resolution.height} px
          </span>
        </div>
      )}
      <div className="flex items-center text-sm text-muted-foreground">
        <FileType className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("type")}: {mimeType}
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <FileBox className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("size")}: {formatFileSize(size)}
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("uploadDate")}: <FormattedDate date={new Date(createdAt)} />
        </span>
      </div>
      <div className="flex items-center text-sm text-muted-foreground">
        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>
          {t("lastModifiedDate")}: <FormattedDate date={new Date(updatedAt)} />
        </span>
      </div>
      {url && (
        <div className="mt-4 pt-4 border-t">
          <div
            onClick={handleCopy}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <p className="text-xs text-muted-foreground break-all">
              <span className="font-medium text-foreground">{t("url")}:</span>{" "}
              {url}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
