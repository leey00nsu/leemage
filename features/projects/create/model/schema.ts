import { z } from "zod";
import { createProjectRequestSchema } from "@/lib/openapi/schemas/projects";

// OpenAPI 스키마를 Single Source of Truth로 사용
// 기존 코드 호환성을 위해 alias export
export const createProjectSchema = createProjectRequestSchema;

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
