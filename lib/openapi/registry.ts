import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

// 전역 OpenAPI 레지스트리 인스턴스
export const registry = new OpenAPIRegistry();

// Bearer 인증 스키마 등록
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Key",
  description: "API 키를 사용한 인증. 'Authorization: Bearer <API_KEY>' 형식으로 전달",
});
