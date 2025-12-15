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
  })
  .refine(
    (data) => {
      // 이미지 파일인 경우 formats와 sizes가 필요
      if (isImageFile(data.file)) {
        return (
          data.formats &&
          data.formats.length > 0 &&
          data.sizes &&
          data.sizes.length > 0
        );
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
