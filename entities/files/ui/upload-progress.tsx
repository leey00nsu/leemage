"use client";

import { Progress } from "@/shared/ui/progress";

interface UploadProgressProps {
  isUploading: boolean;
  error?: Error | null;
}

export function UploadProgress({ isUploading, error }: UploadProgressProps) {
  if (!isUploading && !error) return null;

  return (
    <div className="space-y-2">
      {isUploading && (
        <>
          <Progress value={undefined} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            업로드 중...
          </p>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">
          {error.message || "업로드 중 오류 발생"}
        </p>
      )}
    </div>
  );
}
