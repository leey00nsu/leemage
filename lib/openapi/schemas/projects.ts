import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";
import { fileResponseSchema } from "./files";


// 스토리지 프로바이더 스키마
export const storageProviderSchema = z
  .enum(["OCI", "R2"])
  .openapi({
    description:
      "Storage provider type. Allowed values: OCI (Oracle Cloud Infrastructure Object Storage), R2 (Cloudflare R2)",
    example: "OCI",
  });

// 프로젝트 ID 파라미터 스키마
export const projectIdParamSchema = z.object({
  projectId: z.string().openapi({
    description: "Project ID",
    example: "clq1234abcd",
  }),
});

// 프로젝트 생성 요청 스키마 (API 핸들러에서도 사용)
export const createProjectRequestSchema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Project name must be at least 3 characters." })
      .max(50, { message: "Project name must not exceed 50 characters." })
      .openapi({
        description: "Project name (3-50 characters)",
        example: "Website Assets",
      }),
    description: z
      .string()
      .max(200, { message: "Description must not exceed 200 characters." })
      .optional()
      .openapi({
        description: "Project description (max 200 characters)",
        example: "File collection used for the website",
      }),
    storageProvider: storageProviderSchema
      .default("OCI")
      .openapi({
        description: "Storage provider (default: OCI). Allowed values: OCI, R2",
        example: "OCI",
      }),
  })
  .openapi("CreateProjectRequest");

// 프로젝트 응답 스키마
export const projectResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "Project ID",
      example: "clq1234abcd",
    }),
    name: z.string().openapi({
      description: "Project name",
      example: "Website Assets",
    }),
    description: z
      .string()
      .nullable()
      .openapi({
        description: "Project description",
        example: "File collection used for the website",
      }),
    storageProvider: storageProviderSchema.openapi({
      description: "Storage provider",
      example: "OCI",
    }),
    createdAt: z.string().openapi({
      description: "Created at (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "Updated at (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
  })
  .openapi("ProjectResponse");

// 프로젝트 목록 아이템 스키마 (파일 개수 포함)
export const projectListItemResponseSchema = projectResponseSchema
  .extend({
    fileCount: z.number().int().nonnegative().openapi({
      description: "Number of files in the project",
      example: 12,
    }),
  })
  .openapi("ProjectListItemResponse");

// 프로젝트 상세 응답 스키마 (파일 목록 포함)
export const projectDetailsResponseSchema = projectResponseSchema
  .extend({
    files: z.array(fileResponseSchema).openapi({
      description: "List of files in the project",
    }),
  })
  .openapi("ProjectDetailsResponse");

// 프로젝트 목록 응답 스키마
export const projectListResponseSchema = z
  .array(projectListItemResponseSchema)
  .openapi("ProjectListResponse");

// 프로젝트 수정 요청 스키마
export const updateProjectRequestSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Project name is required." })
      .max(50, { message: "Project name must not exceed 50 characters." })
      .optional()
      .openapi({
        description: "Project name (1-50 characters)",
        example: "Updated Project Name",
      }),
    description: z
      .string()
      .max(200, { message: "Description must not exceed 200 characters." })
      .optional()
      .openapi({
        description: "Project description (max 200 characters)",
        example: "Updated project description",
      }),
  })
  .openapi("UpdateProjectRequest");

// 스키마 등록
registry.register("CreateProjectRequest", createProjectRequestSchema);
registry.register("UpdateProjectRequest", updateProjectRequestSchema);
registry.register("ProjectResponse", projectResponseSchema);
registry.register("ProjectListItemResponse", projectListItemResponseSchema);
registry.register("ProjectDetailsResponse", projectDetailsResponseSchema);
registry.register("ProjectListResponse", projectListResponseSchema);
