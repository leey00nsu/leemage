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

// 번역 함수 타입
type TranslationFunction = (key: string, values?: Record<string, string>) => string;

// 파일 크기 검증이 포함된 기본 파일 스키마
const validatedFileSchema = createFileSizeSchema(DEFAULT_MAX_FILE_SIZE);

// 모든 파일 타입 업로드 스키마 팩토리 (variants 선택적)
export const createFileUploadSchema = (t: TranslationFunction) =>
  z
    .object({
      file: validatedFileSchema,
      formats: z.array(z.enum(AVAILABLE_FORMATS)).optional(),
      sizes: z.array(z.enum(AVAILABLE_SIZES)).optional(),
      customResolutions: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
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
        message: t("file.imageFormatAndSizeRequired"),
        path: ["formats"],
      }
    );

// 커스텀 해상도 검증 스키마 팩토리
export const createCustomResolutionSchema = (t: TranslationFunction) =>
  z.object({
    width: z
      .number()
      .int(t("resolution.widthInteger"))
      .min(1, t("resolution.widthMin"))
      .max(10000, t("resolution.widthMax")),
    height: z
      .number()
      .int(t("resolution.heightInteger"))
      .min(1, t("resolution.heightMin"))
      .max(10000, t("resolution.heightMax")),
  });

// 커스텀 해상도 배열 검증 스키마 팩토리
export const createCustomResolutionsArraySchema = (t: TranslationFunction) =>
  z.array(z.string()).max(10, t("file.customResolutionsMax"));

// ===== 기본 스키마 (서버 사이드 또는 폴백용) =====

export const fileUploadSchema = z
  .object({
    file: validatedFileSchema,
    formats: z.array(z.enum(AVAILABLE_FORMATS)).optional(),
    sizes: z.array(z.enum(AVAILABLE_SIZES)).optional(),
    customResolutions: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
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
      message: "이미지 파일은 최소 하나 이상의 포맷과 크기를 선택해야 합니다.",
      path: ["formats"],
    }
  );

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

export const customResolutionsArraySchema = z
  .array(z.string())
  .max(10, "커스텀 해상도는 최대 10개까지 추가할 수 있습니다.");

// ===== 타입 정의 =====

export type FileUploadFormValues = z.infer<typeof fileUploadSchema>;
export type CustomResolution = z.infer<typeof customResolutionSchema>;

// ===== 유틸리티 함수 =====

// 커스텀 해상도 검증 함수 (i18n 지원)
export function validateCustomResolution(
  width: number,
  height: number,
  t?: TranslationFunction
): { success: true; data: CustomResolution } | { success: false; error: string } {
  const schema = t ? createCustomResolutionSchema(t) : customResolutionSchema;
  const result = schema.safeParse({ width, height });
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0];
  const fallbackMessage = t ? t("resolution.invalid") : "유효하지 않은 해상도입니다.";
  return { success: false, error: firstError?.message || fallbackMessage };
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
