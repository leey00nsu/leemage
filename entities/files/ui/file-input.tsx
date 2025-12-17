"use client";

import { ChangeEvent } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  FileThumbnailPreview,
  ImageDimensions,
} from "@/features/files/upload/ui/file-thumbnail-preview";
import { formatFileSize } from "@/shared/lib/file-utils";

interface FileInputProps {
  onChange: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
  label?: string;
  accept?: string;
  id?: string;
  showPreview?: boolean;
  onDimensionsLoad?: (dimensions: ImageDimensions | null) => void;
}

export function FileInput({
  onChange,
  selectedFile,
  disabled = false,
  label = "파일",
  accept = "*/*",
  id = "file-input",
  showPreview = true,
  onDimensionsLoad,
}: FileInputProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onChange(event.target.files[0]);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor={id} className="text-right">
          {label}
        </Label>
        <Input
          id={id}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="col-span-3"
          disabled={disabled}
        />
      </div>

      {selectedFile && (
        <>
          <div className="text-sm text-muted-foreground pl-[25%]">
            {selectedFile.name} ({formatFileSize(selectedFile.size)})
          </div>
          {showPreview && (
            <div className="flex justify-center">
              <FileThumbnailPreview
                file={selectedFile}
                maxSize={160}
                onDimensionsLoad={onDimensionsLoad}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
