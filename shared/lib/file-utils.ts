import { z } from "zod";

// 이미지 MIME 타입 목록
const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
] as const;

// 기본 최대 파일 크기 (50MB)
export const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * MIME 타입이 이미지인지 확인
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * File 객체에서 MIME 타입 추출
 */
export function getMimeType(file: File): string {
  return file.type || "application/octet-stream";
}

/**
 * 파일이 이미지인지 확인
 */
export function isImageFile(file: File): boolean {
  return isImageMimeType(getMimeType(file));
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(
  file: File,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): boolean {
  return file.size <= maxSize;
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형식으로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

// Zod 스키마: 파일 검증
export const fileSchema = z.custom<File>((val) => val instanceof File, {
  message: "유효한 파일이 아닙니다.",
});

// Zod 스키마: 파일 크기 검증 (커스텀 최대 크기)
export const createFileSizeSchema = (maxSize: number = DEFAULT_MAX_FILE_SIZE) =>
  fileSchema.refine((file) => file.size <= maxSize, {
    message: `파일 크기가 ${formatFileSize(maxSize)}를 초과했습니다.`,
  });

// Zod 스키마: 이미지 파일 검증
export const imageFileSchema = fileSchema.refine(
  (file) => isImageFile(file),
  "이미지 파일만 업로드 가능합니다."
);

// Zod 스키마: 모든 파일 타입 허용 (크기만 검증)
export const anyFileSchema = createFileSizeSchema(DEFAULT_MAX_FILE_SIZE);
