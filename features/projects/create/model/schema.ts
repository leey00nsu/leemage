import { z } from "zod";
import { createProjectRequestSchema, storageProviderSchema } from "@/lib/openapi/schemas/projects";

// 번역 함수 타입
type TranslationFunction = (key: string) => string;

// 스키마 팩토리 함수 - 번역 함수를 받아서 스키마 생성
export const createCreateProjectSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .min(3, { message: t("project.nameMin") })
      .max(50, { message: t("project.nameMax") }),
    description: z
      .string()
      .max(200, { message: t("project.descriptionMax") })
      .optional(),
    storageProvider: storageProviderSchema.default("OCI"),
  });

// 기본 스키마 (서버 사이드 또는 폴백용) - OpenAPI 스키마를 Single Source of Truth로 사용
export const createProjectSchema = createProjectRequestSchema;

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
