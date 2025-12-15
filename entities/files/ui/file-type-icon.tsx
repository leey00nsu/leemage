"use client";

import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  Presentation,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface FileTypeIconProps {
  mimeType: string;
  className?: string;
  size?: number;
}

/**
 * MIME 타입에 따른 파일 아이콘 컴포넌트
 */
export function FileTypeIcon({
  mimeType,
  className,
  size = 24,
}: FileTypeIconProps) {
  const iconProps = {
    size,
    className: cn("text-muted-foreground", className),
  };

  // 이미지 파일
  if (mimeType.startsWith("image/")) {
    return <FileImage {...iconProps} />;
  }

  // 비디오 파일
  if (mimeType.startsWith("video/")) {
    return <FileVideo {...iconProps} />;
  }

  // 오디오 파일
  if (mimeType.startsWith("audio/")) {
    return <FileAudio {...iconProps} />;
  }

  // 텍스트 파일
  if (mimeType.startsWith("text/")) {
    return <FileText {...iconProps} />;
  }

  // 특정 MIME 타입별 아이콘
  switch (mimeType) {
    // PDF
    case "application/pdf":
      return <FileText {...iconProps} className={cn(iconProps.className, "text-red-500")} />;

    // 압축 파일
    case "application/zip":
    case "application/x-rar-compressed":
    case "application/x-7z-compressed":
    case "application/gzip":
    case "application/x-tar":
      return <FileArchive {...iconProps} />;

    // 코드 파일
    case "application/javascript":
    case "application/typescript":
    case "application/json":
    case "application/xml":
    case "text/html":
    case "text/css":
      return <FileCode {...iconProps} />;

    // 스프레드시트
    case "application/vnd.ms-excel":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return <FileSpreadsheet {...iconProps} className={cn(iconProps.className, "text-green-600")} />;

    // 프레젠테이션
    case "application/vnd.ms-powerpoint":
    case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      return <Presentation {...iconProps} className={cn(iconProps.className, "text-orange-500")} />;

    // Word 문서
    case "application/msword":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return <FileText {...iconProps} className={cn(iconProps.className, "text-blue-600")} />;

    // 기본 파일 아이콘
    default:
      return <File {...iconProps} />;
  }
}

/**
 * 파일 확장자에서 아이콘 가져오기 (MIME 타입을 모를 때 사용)
 */
export function getIconByExtension(filename: string): React.ReactNode {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const extensionToMime: Record<string, string> = {
    // 이미지
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    // 문서
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // 압축
    zip: "application/zip",
    rar: "application/x-rar-compressed",
    "7z": "application/x-7z-compressed",
    // 코드
    js: "application/javascript",
    ts: "application/typescript",
    json: "application/json",
    html: "text/html",
    css: "text/css",
    // 텍스트
    txt: "text/plain",
    md: "text/markdown",
  };

  const mimeType = extensionToMime[ext] || "application/octet-stream";
  return <FileTypeIcon mimeType={mimeType} />;
}
