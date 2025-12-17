import { z } from "zod";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";
import {
  createFileSizeSchema,
  DEFAULT_MAX_FILE_SIZE,
  isImageFile,
} from "@/shared/lib/file-utils";

// 파일 크기 검증이 포함된 기본 파일 스키마
const validatedFileSchema = createFileSizeSchema(DEFAULT_MAX_FILE_SIZE);

// 이미지 업로드 스키마 (variants 필수)
export const imageUploadSchema = z.object({
  file: validatedFileSchema.refine(
    (file) => isImageFile(file),
    "이미지 파일만 업로드 가능합니다."
  ),
  formats: z
    .array(z.enum(AVAILABLE_FORMATS))
    .min(1, "최소 하나 이상의 포맷을 선택해야 합니다."),
  sizes: z
    .array(z.enum(AVAILABLE_SIZES))
    .min(1, "최소 하나 이상의 크기를 선택해야 합니다."),
});

// 모든 파일 타입 업로드 스키마 (variants 선택적)
export const fileUploadSchema = z
  .object({
    file: validatedFileSchema,
    // 이미지인 경우에만 필요
    formats: z.array(z.enum(AVAILABLE_FORMATS)).optional(),
    sizes: z.array(z.enum(AVAILABLE_SIZES)).optional(),
    // 커스텀 해상도 (프리셋 사이즈 대신 사용 가능)
    customResolutions: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // 이미지 파일인 경우 formats와 (sizes 또는 customResolutions)가 필요
      if (isImageFile(data.file)) {
        const hasFormats = data.formats && data.formats.length > 0;
        const hasSizes =
          (data.sizes && data.sizes.length > 0) ||
          (data.customResolutions && data.customResolutions.length > 0);
        return hasFormats && hasSizes;
      }
      return true;
    },
    {
      message:
        "이미지 파일은 최소 하나 이상의 포맷과 크기를 선택해야 합니다.",
      path: ["formats"],
    }
  );

export type ImageUploadFormValues = z.infer<typeof imageUploadSchema>;
export type FileUploadFormValues = z.infer<typeof fileUploadSchema>;

// 커스텀 해상도 검증 스키마
export const customResolutionSchema = z.object({
  width: z
    .number()
    .int("너비는 정수여야 합니다.")
    .min(1, "너비는 1 이상이어야 합니다.")
    .max(10000, "너비는 10000 이하여야 합니다."),
  height: z
    .number()
    .int("높이는 정수여야 합니다.")
    .min(1, "높이는 1 이상이어야 합니다.")
    .max(10000, "높이는 10000 이하여야 합니다."),
});

export type CustomResolution = z.infer<typeof customResolutionSchema>;

// 커스텀 해상도 검증 함수
export function validateCustomResolution(
  width: number,
  height: number
): { success: true; data: CustomResolution } | { success: false; error: string } {
  const result = customResolutionSchema.safeParse({ width, height });
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  return { success: false, error: firstError?.message || "유효하지 않은 해상도입니다." };
}

// 커스텀 해상도를 문자열로 포맷
export function formatCustomResolution(width: number, height: number): string {
  return `${width}x${height}`;
}

// 문자열에서 커스텀 해상도 파싱
export function parseCustomResolution(
  resolution: string
): { width: number; height: number } | null {
  const match = resolution.match(/^(\d+)x(\d+)$/);
  if (!match) return null;
  return {
    width: parseInt(match[1], 10),
    height: parseInt(match[2], 10),
  };
}

// 커스텀 해상도 배열 검증 (최대 10개)
export const customResolutionsArraySchema = z
  .array(z.string())
  .max(10, "커스텀 해상도는 최대 10개까지 추가할 수 있습니다.");
