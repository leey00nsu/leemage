import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";
import { fileResponseSchema } from "./files";


// 스토리지 프로바이더 스키마
export const storageProviderSchema = z
  .enum(["OCI", "R2"])
  .openapi({
    description: "스토리지 프로바이더 타입. 허용 값: OCI (Oracle Cloud Infrastructure Object Storage), R2 (Cloudflare R2)",
    example: "OCI",
  });

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
        example: "Website Assets",
      }),
    description: z
      .string()
      .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
      .optional()
      .openapi({
        description: "프로젝트 설명 (최대 200자)",
        example: "Image collection used for the website",
      }),
    storageProvider: storageProviderSchema
      .default("OCI")
      .openapi({
        description: "스토리지 프로바이더 (기본값: OCI). 허용 값: OCI, R2",
        example: "OCI",
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
      example: "Website Assets",
    }),
    description: z
      .string()
      .nullable()
      .openapi({
        description: "프로젝트 설명",
        example: "Image collection used for the website",
      }),
    storageProvider: storageProviderSchema.openapi({
      description: "스토리지 프로바이더",
      example: "OCI",
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

// 프로젝트 수정 요청 스키마
export const updateProjectRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "프로젝트 이름은 필수입니다." })
      .max(50, { message: "프로젝트 이름은 50자를 초과할 수 없습니다." })
      .optional()
      .openapi({
        description: "프로젝트 이름 (1-50자)",
        example: "Updated Project Name",
      }),
    description: z
      .string()
      .max(200, { message: "설명은 200자를 초과할 수 없습니다." })
      .optional()
      .openapi({
        description: "프로젝트 설명 (최대 200자)",
        example: "Updated project description",
      }),
  })
  .openapi("UpdateProjectRequest");

// 스키마 등록
registry.register("CreateProjectRequest", createProjectRequestSchema);
registry.register("UpdateProjectRequest", updateProjectRequestSchema);
registry.register("ProjectResponse", projectResponseSchema);
registry.register("ProjectDetailsResponse", projectDetailsResponseSchema);
registry.register("ProjectListResponse", projectListResponseSchema);
