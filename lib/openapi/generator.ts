import {
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";

// OpenAPI 스펙 타입
export type OpenAPISpec = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

/**
 * 등록된 모든 엔드포인트와 스키마로부터 OpenAPI 스펙을 생성합니다.
 */
export function generateOpenAPISpec(): OpenAPISpec {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Leemage API",
      version: "1.0.0",
      description:
        "Leemage file management platform API. Manage files by project and process image transformations.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 (API Key authentication)",
      },
    ],
    tags: [
      {
        name: "Projects",
        description: "Project management API",
      },
      {
        name: "Files",
        description: "File upload and management API",
      },
    ],
  });
}

/**
 * OpenAPI 스펙을 JSON 문자열로 반환합니다.
 */
export function generateOpenAPISpecJSON(): string {
  return JSON.stringify(generateOpenAPISpec(), null, 2);
}
