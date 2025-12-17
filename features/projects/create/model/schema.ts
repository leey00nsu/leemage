import { z } from "zod";
import { createProjectRequestSchema } from "@/lib/openapi/schemas/projects";

// OpenAPI 스키마를 Single Source of Truth로 사용
export const createProjectSchema = createProjectRequestSchema;

export type CreateProjectFormValues = z.infer<typeof createProjectSchema>;
