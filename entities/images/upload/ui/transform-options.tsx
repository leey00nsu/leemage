"use client";

import { Checkbox } from "@/shared/ui/checkbox";
import { Label } from "@/shared/ui/label";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";

export type SizeOption = (typeof AVAILABLE_SIZES)[number];
export type FormatOption = (typeof AVAILABLE_FORMATS)[number];

interface TransformOptionsProps {
  selectedSizes: Set<string>;
  selectedFormats: Set<string>;
  onSizeChange: (size: string, checked: boolean | string) => void;
  onFormatChange: (format: string, checked: boolean | string) => void;
  disabled?: boolean;
}

export function TransformOptions({
  selectedSizes,
  selectedFormats,
  onSizeChange,
  onFormatChange,
  disabled = false,
}: TransformOptionsProps) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <h4 className="mb-2 font-medium ">변환 옵션</h4>

      <div className="space-y-2">
        <Label>크기 (Size)</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABLE_SIZES.map((size) => (
            <div key={size} className="flex items-center space-x-2">
              <Checkbox
                id={`size-${size}`}
                checked={selectedSizes.has(size)}
                onCheckedChange={(checked) => onSizeChange(size, checked)}
                disabled={disabled}
              />
              <label
                htmlFor={`size-${size}`}
                className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {size === "original" ? "원본 (original)" : size}
              </label>
              {size === "original" && (
                <span className="text-xs text-muted-foreground ml-1">
                  가공 없이 원본 이미지를 그대로 저장합니다
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>포맷 (Format)</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {AVAILABLE_FORMATS.map((format) => (
            <div key={format} className="flex items-center space-x-2">
              <Checkbox
                id={`format-${format}`}
                checked={selectedFormats.has(format)}
                onCheckedChange={(checked) => onFormatChange(format, checked)}
                disabled={disabled}
              />
              <label
                htmlFor={`format-${format}`}
                className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {format.toUpperCase()}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
