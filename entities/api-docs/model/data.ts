import { ApiCategory } from "./types";
import { generateOpenAPISpec } from "@/lib/openapi";
import { transformOpenAPIToCategories } from "./openapi-transformer";

/**
 * OpenAPI 스펙에서 API 문서 데이터를 생성합니다.
 * Zod 스키마가 Single Source of Truth로 사용됩니다.
 */
export const getApiDocsData = async (
  locale: string
): Promise<ApiCategory[]> => {
  // OpenAPI 스펙 생성
  const spec = generateOpenAPISpec();

  // UI 형식으로 변환
  const categories = transformOpenAPIToCategories(spec, locale);

  // 경로를 API v1 형식으로 변환 (예: /projects → /api/v1/projects)
  return categories.map((category) => ({
    ...category,
    endpoints: category.endpoints.map((endpoint) => ({
      ...endpoint,
      path: `/api/v1${endpoint.path}`,
    })),
  }));
};
