import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";
import { cache } from "react";
import { ApiCategory } from "./types";
import { OpenAPISpec } from "@/lib/openapi/generator";
import {
  transformOpenAPIToCategories,
  TranslationGetter,
} from "./openapi-transformer";
import { encodeEndpointPathToRouteSegments } from "./navigation";

const OPENAPI_METHODS = ["get", "post", "put", "patch", "delete"] as const;
type OpenApiMethod = (typeof OPENAPI_METHODS)[number];

const getOpenApiSpec = cache((): OpenAPISpec | null => {
  const yamlPath = join(process.cwd(), "public", "openapi.yaml");

  if (!existsSync(yamlPath)) {
    console.warn("OpenAPI YAML not found. Run 'npm run openapi:generate' first.");
    return null;
  }

  const yamlContent = readFileSync(yamlPath, "utf-8");
  return parse(yamlContent) as OpenAPISpec;
});

/**
 * OpenAPI YAML 파일에서 API 문서 데이터를 생성합니다.
 * 빌드 시 생성된 YAML 파일을 Single Source of Truth로 사용합니다.
 */
export const getApiDocsData = async (
  locale: string,
  t?: TranslationGetter
): Promise<ApiCategory[]> => {
  const spec = getOpenApiSpec();
  if (!spec) {
    return [];
  }

  // UI 형식으로 변환 (base path는 OpenAPI servers.url을 따름)
  const categories = transformOpenAPIToCategories(spec, locale, t);

  return categories;
};

export interface ApiReferenceRoute {
  method: Uppercase<OpenApiMethod>;
  path: string;
  routeSegments: string[];
}

export function getApiReferenceRoutes(): ApiReferenceRoute[] {
  const spec = getOpenApiSpec();
  if (!spec) {
    return [];
  }

  const routes: ApiReferenceRoute[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of OPENAPI_METHODS) {
      if (!pathItem?.[method]) {
        continue;
      }

      routes.push({
        method: method.toUpperCase() as Uppercase<OpenApiMethod>,
        path,
        routeSegments: encodeEndpointPathToRouteSegments(path),
      });
    }
  }

  return routes;
}
