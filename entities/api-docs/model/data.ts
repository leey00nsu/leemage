import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { ApiCategory } from "./types";
import { OpenAPISpec } from "@/lib/openapi/generator";
import {
  transformOpenAPIToCategories,
  TranslationGetter,
} from "./openapi-transformer";

/**
 * OpenAPI YAML 파일에서 API 문서 데이터를 생성합니다.
 * 빌드 시 생성된 YAML 파일을 Single Source of Truth로 사용합니다.
 */
export const getApiDocsData = async (
  locale: string,
  t?: TranslationGetter
): Promise<ApiCategory[]> => {
  const yamlPath = join(process.cwd(), "public", "openapi.yaml");

  if (!existsSync(yamlPath)) {
    console.warn("OpenAPI YAML not found. Run 'npm run openapi:generate' first.");
    return [];
  }

  // YAML 파일 파싱
  const yamlContent = readFileSync(yamlPath, "utf-8");
  const spec = parse(yamlContent) as OpenAPISpec;

  // UI 형식으로 변환 (YAML에는 이미 /api/v1 prefix가 포함됨)
  const categories = transformOpenAPIToCategories(spec, locale, t);

  return categories;
};
