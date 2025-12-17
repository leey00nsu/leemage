export const AVAILABLE_SIZES = [
  "original",
  "300x300",
  "800x800",
  "1920x1080",
] as const;

export const AVAILABLE_FORMATS = ["png", "jpeg", "avif", "webp"] as const;

export type FormatType = (typeof AVAILABLE_FORMATS)[number];

// 포맷별 설명 키 (next-intl 번역 키로 사용)
export const FORMAT_DESCRIPTION_KEYS: Record<FormatType, string> = {
  png: "FormatDescriptions.png",
  jpeg: "FormatDescriptions.jpeg",
  avif: "FormatDescriptions.avif",
  webp: "FormatDescriptions.webp",
} as const;
