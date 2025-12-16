import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";
import { fileResponseSchema } from "./files";

// 프로젝트 ID 파라미터 스키마
export const projectIdParamSchema = z.object({
  projectId: z.string().openapi({
    description: "프로젝트 ID",
    example: "clq1234abcd",
  }),
});

// 프로젝트 생성 요청 스키마 (API 핸들러에서도 사용)
export const createProjectRequestSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "프로젝트 이름은 3자 이상이어야 합니다." })
      .max(50, { message: "프로젝트 이름은 50자를 초과할 수 없습니다." })
      .openapi({
        description: "프로젝트 이름 (3-50자)",
        example: "내 웹사이트 에셋",
      }),
    description: z
      .string()
      .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
      .optional()
      .openapi({
        description: "프로젝트 설명 (최대 200자)",
        example: "웹사이트에서 사용할 이미지 모음",
      }),
  })
  .openapi("CreateProjectRequest");

// 프로젝트 응답 스키마
export const projectResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "프로젝트 ID",
      example: "clq1234abcd",
    }),
    name: z.string().openapi({
      description: "프로젝트 이름",
      example: "내 웹사이트 에셋",
    }),
    description: z
      .string()
      .nullable()
      .openapi({
        description: "프로젝트 설명",
        example: "웹사이트에서 사용할 이미지 모음",
      }),
    createdAt: z.string().openapi({
      description: "생성 일시 (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "수정 일시 (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
  })
  .openapi("ProjectResponse");

// 프로젝트 상세 응답 스키마 (파일 목록 포함)
export const projectDetailsResponseSchema = projectResponseSchema
  .extend({
    files: z.array(fileResponseSchema).openapi({
      description: "프로젝트에 속한 파일 목록",
    }),
  })
  .openapi("ProjectDetailsResponse");

// 프로젝트 목록 응답 스키마
export const projectListResponseSchema = z
  .array(projectResponseSchema)
  .openapi("ProjectListResponse");

// 스키마 등록
registry.register("CreateProjectRequest", createProjectRequestSchema);
registry.register("ProjectResponse", projectResponseSchema);
registry.register("ProjectDetailsResponse", projectDetailsResponseSchema);
registry.register("ProjectListResponse", projectListResponseSchema);
