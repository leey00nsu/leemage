"use client";

import { Progress } from "@/shared/ui/progress";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export type UploadStatus =
  | "idle"
  | "presigning"
  | "uploading"
  | "confirming"
  | "processing"
  | "complete"
  | "error";

interface UploadProgressProps {
  status: UploadStatus;
  progress?: number;
  statusMessage?: string;
}

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
  status,
  progress,
  statusMessage,
}: UploadProgressProps) {
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
