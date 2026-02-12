import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

// 전역 OpenAPI 레지스트리 인스턴스
export const registry = new OpenAPIRegistry();

// Bearer 인증 스키마 등록
registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "API Key",
  description:
    "API key authentication. Send as 'Authorization: Bearer <API_KEY>'.",
});
