export const AVAILABLE_SIZES = [
  "source",
  "max300",
  "max800",
  "max1920",
] as const;

// 프리셋 사이즈의 최대 픽셀 값
export const SIZE_MAX_PIXELS: Record<string, number> = {
  max300: 300,
  max800: 800,
  max1920: 1920,
};

export const AVAILABLE_FORMATS = ["png", "jpeg", "avif", "webp"] as const;

export type FormatType = (typeof AVAILABLE_FORMATS)[number];
export type SizeType = (typeof AVAILABLE_SIZES)[number];

// 포맷별 설명 키 (next-intl 번역 키로 사용)
export const FORMAT_DESCRIPTION_KEYS: Record<FormatType, string> = {
  png: "FormatDescriptions.png",
  jpeg: "FormatDescriptions.jpeg",
  avif: "FormatDescriptions.avif",
  webp: "FormatDescriptions.webp",
} as const;

// 프리셋이 원본 width보다 작은지 확인
export function isPresetSmallerThanOriginal(
  preset: string,
  originalWidth?: number,
  originalHeight?: number
): boolean {
  if (!originalWidth || !originalHeight) return true;
  if (preset === "source") return true;
  
  const maxPixels = SIZE_MAX_PIXELS[preset];
  if (!maxPixels) return true;
  
  // width 기준으로 비교
  return maxPixels < originalWidth;
}
