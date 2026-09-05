export const fileTypes = [
  "ALL",
  "IMAGE",
  "VIDEO",
  "AUDIO",
  "DOCUMENT",
  "ARCHIVE",
  "OTHER",
] as const;
export type FileTypeFilter = (typeof fileTypes)[number];
export const sortOrders = [
  "NEWEST",
  "OLDEST",
  "NAME_ASC",
  "NAME_DESC",
  "SIZE_DESC",
] as const;
export type SortOrder = (typeof sortOrders)[number];
export function getFileType(file: {
  mimeType: string;
}): Exclude<FileTypeFilter, "ALL"> {
  const mime = file.mimeType.toLowerCase().split(";")[0].trim();
  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime.startsWith("audio/")) return "AUDIO";
  if (/zip|rar|7z|gzip|tar|compressed/.test(mime)) return "ARCHIVE";
  if (
    mime.startsWith("text/") ||
    /pdf|document|sheet|presentation|msword|ms-excel|ms-powerpoint|json|xml|rtf/.test(
      mime,
    )
  )
    return "DOCUMENT";
  return "OTHER";
}
export function getFormatKey(mime: string) {
  return mime.toLowerCase().split(";")[0].trim();
}

export function getFormatLabel(mime: string): string {
  const labels: Record<string, string> = {
    "image/svg+xml": "SVG",
    "image/jpeg": "JPEG",
    "audio/mpeg": "MP3",
    "audio/mp4": "M4A",
    "audio/x-wav": "WAV",
    "video/quicktime": "MOV",
    "video/x-msvideo": "AVI",
    "application/msword": "DOC",
    "application/vnd.ms-excel": "XLS",
    "application/vnd.ms-powerpoint": "PPT",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "DOCX",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      "PPTX",
    "application/x-rar-compressed": "RAR",
    "application/vnd.rar": "RAR",
    "application/x-7z-compressed": "7Z",
    "application/octet-stream": "BIN",
    "text/plain": "TXT",
  };
  const key = getFormatKey(mime);
  return labels[key] || (key.split("/")[1] || key).toUpperCase();
}

export const assetPageSizes = [30, 50, 100] as const;
export function getAssetPageSize(value: string | null): number {
  const size = Number(value);
  return assetPageSizes.some((allowed) => allowed === size) ? size : 30;
}
