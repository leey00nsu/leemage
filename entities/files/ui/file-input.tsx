"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import {
  FileThumbnailPreview,
  ImageDimensions,
} from "@/features/files/upload/ui/file-thumbnail-preview";
import { formatFileSize } from "@/shared/lib/file-utils";
import { cn } from "@/shared/lib/utils";

interface FileInputProps {
  maxFileSize?: number;
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
  maxFileSize = 50 * 1024 * 1024,
  onChange,
  selectedFile,
  disabled = false,
  label = "파일",
  accept = "*/*",
  id = "file-input",
  showPreview = true,
  onDimensionsLoad,
}: FileInputProps) {
  const t = useTranslations("UploadOptions");
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="min-w-0 space-y-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        aria-label={label}
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          if (disabled || !event.dataTransfer.types.includes("Files")) return;
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = disabled ? "none" : "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (!dragDepth.current) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (!disabled && file) onChange(file);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 text-center transition-colors hover:border-primary hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          selectedFile ? "py-4" : "py-8",
          dragging && "border-primary bg-primary/5",
        )}
      >
        <Upload aria-hidden="true" className="size-5 text-muted-foreground" />
        <span className="max-w-full break-all text-sm font-medium">
          {selectedFile ? selectedFile.name : t("dropPrompt")}
        </span>
        <span className="text-xs text-muted-foreground">
          {selectedFile
            ? `${formatFileSize(selectedFile.size)} · ${t("replaceFile")}`
            : t("dropHint", { limit: maxFileSize / (1024 * 1024) })}
        </span>
      </button>
      {selectedFile && showPreview && (
        <div className="flex justify-center">
          <FileThumbnailPreview
            file={selectedFile}
            maxSize={160}
            onDimensionsLoad={onDimensionsLoad}
          />
        </div>
      )}
    </div>
  );
}
