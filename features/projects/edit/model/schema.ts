import { z } from "zod";

// 번역 함수 타입
type TranslationFunction = (key: string) => string;

// 스키마 팩토리 함수 - 번역 함수를 받아서 스키마 생성
export const createEditProjectSchema = (t: TranslationFunction) =>
  z.object({
    name: z
      .string()
      .min(1, { message: t("project.nameRequired") })
      .max(50, { message: t("project.nameMax") }),
    description: z
      .string()
      .max(200, { message: t("project.descriptionMax") })
      .optional(),
  });

// 기본 스키마 (서버 사이드 또는 폴백용)
export const editProjectSchema = z.object({
  name: z
    .string()
    .min(1, { message: "프로젝트 이름은 필수입니다." })
    .max(50, { message: "프로젝트 이름은 50자를 초과할 수 없습니다." }),
  description: z
    .string()
    .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
    .optional(),
});

export type EditProjectFormValues = z.infer<typeof editProjectSchema>;
