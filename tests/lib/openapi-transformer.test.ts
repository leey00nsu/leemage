import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { transformOpenAPIToCategories } from "@/entities/api-docs/model/openapi-transformer";

describe("OpenAPI UI 변환기", () => {
  // 상태 코드 생성기
  const statusCodeArb = fc.constantFrom(200, 201, 400, 401, 404, 500);

  // 경로 생성기
  const pathArb = fc.stringMatching(/^\/[a-z]+$/);

  it("변환된 출력에 모든 응답 상태 코드가 포함되어야 한다", () => {
    fc.assert(
      fc.property(
        pathArb,
        fc.array(statusCodeArb, { minLength: 1, maxLength: 4 }),
        (path, statusCodes) => {
          const registry = new OpenAPIRegistry();
          const uniqueCodes = [...new Set(statusCodes)];

          // 응답 객체 생성
          const responses: Record<number, { description: string }> = {};
          uniqueCodes.forEach((code) => {
            responses[code] = { description: `Response ${code}` };
          });

          // 엔드포인트 등록
          registry.registerPath({
            method: "get",
            path,
            tags: ["Test"],
            responses,
          });

          // 스펙 생성
          const generator = new OpenApiGeneratorV3(registry.definitions);
          const spec = generator.generateDocument({
            openapi: "3.0.0",
            info: { title: "Test API", version: "1.0.0" },
          });

          // 변환
          const categories = transformOpenAPIToCategories(spec, "ko");

          // 검증: 카테고리가 존재해야 함
          expect(categories.length).toBeGreaterThan(0);

          // 검증: 엔드포인트가 존재해야 함
          const endpoint = categories[0].endpoints.find((e) => e.path === path);
          expect(endpoint).toBeDefined();

          // 검증: 모든 상태 코드가 응답에 포함되어야 함
          uniqueCodes.forEach((code) => {
            const response = endpoint!.responses.find((r) => r.status === code);
            expect(response).toBeDefined();
            expect(response!.description).toBe(`Response ${code}`);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("엔드포인트 메서드를 대문자로 올바르게 변환해야 한다", () => {
    const methods = ["get", "post", "put", "delete", "patch"] as const;

    methods.forEach((method) => {
      const registry = new OpenAPIRegistry();

      registry.registerPath({
        method,
        path: "/test",
        tags: ["Test"],
        responses: {
          200: { description: "Success" },
        },
      });

      const generator = new OpenApiGeneratorV3(registry.definitions);
      const spec = generator.generateDocument({
        openapi: "3.0.0",
        info: { title: "Test API", version: "1.0.0" },
      });

      const categories = transformOpenAPIToCategories(spec, "ko");
      const endpoint = categories[0].endpoints[0];

      expect(endpoint.method).toBe(method.toUpperCase());
    });
  });

  it("보안이 정의된 경우 auth를 true로 설정해야 한다", () => {
    const registry = new OpenAPIRegistry();

    // 인증이 필요한 엔드포인트
    registry.registerPath({
      method: "get",
      path: "/secure",
      tags: ["Test"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Success" },
      },
    });

    // 인증이 필요 없는 엔드포인트
    registry.registerPath({
      method: "get",
      path: "/public",
      tags: ["Test"],
      responses: {
        200: { description: "Success" },
      },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });

    const categories = transformOpenAPIToCategories(spec, "ko");
    const secureEndpoint = categories[0].endpoints.find(
      (e) => e.path === "/secure",
    );
    const publicEndpoint = categories[0].endpoints.find(
      (e) => e.path === "/public",
    );

    expect(secureEndpoint?.auth).toBe(true);
    expect(publicEndpoint?.auth).toBe(false);
  });
});
