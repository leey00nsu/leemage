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
  saveOriginal: boolean;
  onSizeChange: (size: string, checked: boolean | string) => void;
  onFormatChange: (format: string, checked: boolean | string) => void;
  onSaveOriginalChange: (checked: boolean | string) => void;
  disabled?: boolean;
}

export function TransformOptions({
  selectedSizes,
  selectedFormats,
  saveOriginal,
  onSizeChange,
  onFormatChange,
  onSaveOriginalChange,
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
                {size}
              </label>
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

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="save-original"
          checked={saveOriginal}
          onCheckedChange={onSaveOriginalChange}
          disabled={disabled}
        />
        <label
          htmlFor="save-original"
          className="text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          원본 이미지 저장
        </label>
      </div>
    </div>
  );
}
