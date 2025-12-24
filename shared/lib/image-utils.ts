import { ImageVariantData } from "@/entities/files/model/types";

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

// 원본(source) variant 찾기 - 해상도 패턴(WIDTHxHEIGHT) 또는 "source" 레이블
export function findSourceVariant(
  variants: ImageVariantData[]
): ImageVariantData | undefined {
  // 먼저 가장 큰 해상도를 가진 variant를 찾음 (원본일 가능성이 높음)
  // 해상도 패턴: WIDTHxHEIGHT (예: 3024x4032)
  const resolutionPattern = /^\d+x\d+$/;
  
  // 해상도 패턴을 가진 variants 중 가장 큰 것 찾기
  const resolutionVariants = variants.filter((v) => resolutionPattern.test(v.label));
  if (resolutionVariants.length > 0) {
    return resolutionVariants.reduce((max, v) => 
      (v.width * v.height > max.width * max.height) ? v : max
    );
  }
  
  // 레거시: "source" 레이블 찾기
  return variants.find((v) => v.label === "source");
}
