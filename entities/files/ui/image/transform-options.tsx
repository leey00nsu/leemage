"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import { Badge } from "@/shared/ui/badge";
import { X } from "lucide-react";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
  FORMAT_SIZE_REDUCTION_ESTIMATES,
  FormatType,
  isPresetSmallerThanOriginal,
} from "@/shared/config/image-options";
import { formatBytes } from "@/shared/lib/format-bytes";
import { useTranslations } from "next-intl";
import { CustomResolutionInput } from "./custom-resolution-input";

export type SizeOption = (typeof AVAILABLE_SIZES)[number];
export type FormatOption = (typeof AVAILABLE_FORMATS)[number];

interface TransformOptionsProps {
  selectedSizes: Set<string>;
  selectedFormats: Set<string>;
  customResolutions?: string[];
  onSizeChange: (size: string, checked: boolean | string) => void;
  onFormatChange: (format: string, checked: boolean | string) => void;
  onCustomResolutionAdd?: (resolution: string) => void;
  onCustomResolutionRemove?: (resolution: string) => void;
  disabled?: boolean;
  originalWidth?: number;
  originalHeight?: number;
  originalFileSize?: number;
}

// 프리셋 사이즈 표시 텍스트 생성
function getSizeDisplayText(size: string, t: (key: string) => string): string {
  if (size === "source") return t("sourceSize");
  const maxWidthMatch = size.match(/^max(\d+)$/);
  if (maxWidthMatch?.[1]) {
    return `max-width ${maxWidthMatch[1]}px`;
  }
  return size;
}

function getEstimatedSizeRange(
  originalFileSize: number | undefined,
  minReductionPercent: number,
  maxReductionPercent: number,
): { min: string; max: string } | null {
  if (!originalFileSize || originalFileSize <= 0) {
    return null;
  }

  const minSizeBytes = Math.max(
    0,
    Math.round(originalFileSize * (1 - maxReductionPercent / 100)),
  );
  const maxSizeBytes = Math.max(
    0,
    Math.round(originalFileSize * (1 - minReductionPercent / 100)),
  );

  return {
    min: formatBytes(minSizeBytes),
    max: formatBytes(maxSizeBytes),
  };
}

export function TransformOptions({
  selectedSizes,
  selectedFormats,
  customResolutions = [],
  onSizeChange,
  onFormatChange,
  onCustomResolutionAdd,
  onCustomResolutionRemove,
  disabled = false,
  originalWidth,
  originalHeight,
  originalFileSize,
}: TransformOptionsProps) {
  const t = useTranslations("TransformOptions");
  const tFormat = useTranslations("FormatDescriptions");
  const tCustom = useTranslations("CustomResolution");

  return (
    <div className="space-y-4 rounded-md border p-4">
      <h4 className="mb-2 font-medium ">{t("title")}</h4>

      <div className="space-y-2">
        <Label>{t("sizeLabel")}</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABLE_SIZES.map((size) => {
            const isAvailable = isPresetSmallerThanOriginal(
              size,
              originalWidth,
              originalHeight
            );
            const isDisabled = disabled || !isAvailable;

            return (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={selectedSizes.has(size)}
                  onCheckedChange={(checked) => onSizeChange(size, checked)}
                  disabled={isDisabled}
                />
                <label
                  htmlFor={`size-${size}`}
                  className={`text-sm font-medium ${
                    isDisabled ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  {getSizeDisplayText(size, t)}
                </label>
                {size === "source" && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {t("sourceSizeDescription")}
                  </span>
                )}
                {!isAvailable && size !== "source" && (
                  <span className="text-xs text-muted-foreground ml-1">
                    {t("exceedsOriginal")}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* 커스텀 해상도 목록 */}
        {customResolutions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {customResolutions.map((resolution) => (
              <Badge
                key={resolution}
                variant="secondary"
                className="flex items-center gap-1"
              >
                {resolution}
                {onCustomResolutionRemove && (
                  <button
                    type="button"
                    onClick={() => onCustomResolutionRemove(resolution)}
                    disabled={disabled}
                    className="ml-1 hover:text-destructive disabled:opacity-50"
                    aria-label={`${tCustom("remove")} ${resolution}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>
        )}

        {/* 커스텀 해상도 입력 */}
        {onCustomResolutionAdd && (
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground mb-2 block">
              {tCustom("title")}
            </Label>
            <CustomResolutionInput
              onAdd={onCustomResolutionAdd}
              disabled={disabled}
              currentCount={customResolutions.length}
              maxCount={10}
              originalWidth={originalWidth}
              originalHeight={originalHeight}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t("formatLabel")}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AVAILABLE_FORMATS.map((format) => {
            const typedFormat = format as FormatType;
            const estimate = FORMAT_SIZE_REDUCTION_ESTIMATES[typedFormat];
            const estimatedSizeRange = getEstimatedSizeRange(
              originalFileSize,
              estimate.min,
              estimate.max,
            );

            return (
              <div key={format} className="flex items-start space-x-2">
                <Checkbox
                  id={`format-${format}`}
                  checked={selectedFormats.has(format)}
                  onCheckedChange={(checked) => onFormatChange(format, checked)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="flex flex-col">
                  <label
                    htmlFor={`format-${format}`}
                    className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {format.toUpperCase()}
                  </label>
                  <span className="text-xs text-muted-foreground">
                    {tFormat(typedFormat)}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    {estimatedSizeRange
                      ? t("estimatedSize", {
                          min: estimatedSizeRange.min,
                          max: estimatedSizeRange.max,
                          minPercent: estimate.min,
                          maxPercent: estimate.max,
                        })
                      : t("estimatedSizeWithoutFile", {
                          minPercent: estimate.min,
                          maxPercent: estimate.max,
                        })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground">{t("estimateNotice")}</p>
      </div>
    </div>
  );
}
