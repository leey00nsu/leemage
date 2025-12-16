"use client";

import { Progress } from "@/shared/ui/progress";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

// 업로드 상태 타입
export type UploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "confirming"
  | "processing"
  | "complete"
  | "error";

interface UploadProgressProps {
  isUploading?: boolean;
  error?: Error | null;
  // 새로운 props (Presigned URL 업로드용)
  status?: UploadStatus;
  progress?: number;
  statusMessage?: string;
}

// 상태별 기본 메시지
const defaultStatusMessages: Record<UploadStatus, string> = {
  idle: "",
  presigning: "업로드 준비 중...",
  uploading: "업로드 중...",
  confirming: "업로드 완료 확인 중...",
  processing: "이미지 처리 중...",
  complete: "업로드 완료!",
  error: "업로드 실패",
};

export function UploadProgress({
  isUploading,
  error,
  status,
  progress,
  statusMessage,
}: UploadProgressProps) {
  // 새로운 status prop이 있으면 새 UI 사용
  if (status !== undefined) {
    if (status === "idle") return null;

    const message =
      statusMessage ||
      (status === "uploading" && progress !== undefined
        ? `업로드 중... ${progress}%`
        : defaultStatusMessages[status]);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {status === "error" ? (
            <AlertCircle className="h-4 w-4 text-destructive" />
          ) : status === "complete" ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span
            className={`text-sm ${status === "error" ? "text-destructive" : ""}`}
          >
            {message}
          </span>
        </div>
        {(status === "uploading" || status === "presigning") && (
          <Progress value={progress ?? 0} className="h-2" />
        )}
        {status === "processing" && (
          <Progress value={undefined} className="h-2" />
        )}
      </div>
    );
  }

  // 기존 props 호환성 유지
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
