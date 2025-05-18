import { z } from "zod";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";

// 커스텀 파일 검증 함수
const isValidImageFile = (file: File) => {
  return file.type.startsWith("image/");
};

// File 타입을 위한 커스텀 zod 타입
const fileSchema = z.custom<File>((val) => val instanceof File, {
  message: "유효한 파일이 아닙니다.",
});

export const imageUploadSchema = z.object({
  file: fileSchema.refine(isValidImageFile, "이미지 파일만 업로드 가능합니다."),
  formats: z
    .array(z.enum(AVAILABLE_FORMATS))
    .min(1, "최소 하나 이상의 포맷을 선택해야 합니다."),
  sizes: z
    .array(z.enum(AVAILABLE_SIZES))
    .min(1, "최소 하나 이상의 크기를 선택해야 합니다."),
  saveOriginal: z.boolean(),
});

export type ImageUploadFormValues = z.infer<typeof imageUploadSchema>;
