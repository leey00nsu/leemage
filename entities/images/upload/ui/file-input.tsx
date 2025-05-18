"use client";

import { ChangeEvent } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

interface FileInputProps {
  onChange: (file: File | null) => void;
  selectedFile: File | null;
  disabled?: boolean;
  label?: string;
  accept?: string;
  id?: string;
}

export function FileInput({
  onChange,
  selectedFile,
  disabled = false,
  label = "파일",
  accept = "image/*",
  id = "file-input",
}: FileInputProps) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      onChange(event.target.files[0]);
    } else {
      onChange(null);
    }
  };

  return (
    <div className="space-y-2">
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
        <div className="col-span-4 text-sm text-muted-foreground pl-[25%]">
          선택: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
        </div>
      )}
    </div>
  );
}
