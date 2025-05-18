import { ImageVariantData } from "@/entities/images/model/types";

// 파일 크기를 읽기 쉬운 형식으로 변환하는 함수
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// variants 배열에서 특정 레이블의 variant 찾기
export function findVariantByLabel(
  variants: ImageVariantData[],
  label: string
): ImageVariantData | undefined {
  return variants.find((v) => v.label === label);
}
