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
        "Leemage 파일 관리 플랫폼 API. 프로젝트 단위로 파일을 관리하고 이미지 변환 기능을 제공합니다.",
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 (API Key 인증)",
      },
    ],
    tags: [
      {
        name: "Projects",
        description: "프로젝트 관리 API",
      },
      {
        name: "Files",
        description: "파일 업로드 및 관리 API",
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
