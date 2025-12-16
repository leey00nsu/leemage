import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Zod에 OpenAPI 확장 추가
extendZodWithOpenApi(z);

/**
 * **Feature: openapi-docs, Property 2: Endpoint Registration Completeness**
 * *For any* registered endpoint, the generated OpenAPI spec SHALL include
 * the path, method, request body schema (if defined), and all response schemas.
 * **Validates: Requirements 1.3, 2.1**
 */
describe("OpenAPI Endpoint Registration", () => {
  // HTTP 메서드 생성기
  const httpMethodArb = fc.constantFrom(
    "get",
    "post",
    "put",
    "delete",
    "patch"
  ) as fc.Arbitrary<"get" | "post" | "put" | "delete" | "patch">;

  // 경로 생성기 (유효한 OpenAPI 경로)
  const pathArb = fc
    .tuple(
      fc.stringMatching(/^[a-z]+$/),
      fc.option(fc.stringMatching(/^[a-z]+$/))
    )
    .map(([resource, param]) =>
      param ? `/${resource}/{${param}Id}` : `/${resource}`
    );

  // 태그 생성기
  const tagArb = fc.stringMatching(/^[A-Z][a-z]+$/);

  // 상태 코드 생성기
  const statusCodeArb = fc.constantFrom(200, 201, 400, 401, 404, 500);

  it("should include path and method for any registered endpoint", () => {
    fc.assert(
      fc.property(httpMethodArb, pathArb, tagArb, (method, path, tag) => {
        // 새 레지스트리 생성
        const registry = new OpenAPIRegistry();

        // 엔드포인트 등록
        registry.registerPath({
          method,
          path,
          tags: [tag],
          responses: {
            200: {
              description: "Success",
            },
          },
        });

        // 스펙 생성
        const generator = new OpenApiGeneratorV3(registry.definitions);
        const spec = generator.generateDocument({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        });

        // 검증: 경로가 존재해야 함
        expect(spec.paths).toBeDefined();
        expect(spec.paths[path]).toBeDefined();

        // 검증: 메서드가 존재해야 함
        expect(spec.paths[path][method]).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("should include request body schema when defined", () => {
    fc.assert(
      fc.property(
        pathArb,
        fc.array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 3 }),
        (path, propertyNames) => {
          const registry = new OpenAPIRegistry();

          // 동적 스키마 생성
          const schemaObj: Record<string, z.ZodString> = {};
          propertyNames.forEach((name) => {
            schemaObj[name] = z.string();
          });
          const requestSchema = z.object(schemaObj);

          // 엔드포인트 등록 (POST with body)
          registry.registerPath({
            method: "post",
            path,
            tags: ["Test"],
            request: {
              body: {
                content: {
                  "application/json": {
                    schema: requestSchema,
                  },
                },
              },
            },
            responses: {
              201: { description: "Created" },
            },
          });

          // 스펙 생성
          const generator = new OpenApiGeneratorV3(registry.definitions);
          const spec = generator.generateDocument({
            openapi: "3.0.0",
            info: { title: "Test API", version: "1.0.0" },
          });

          // 검증: request body가 존재해야 함
          const endpoint = spec.paths[path].post;
          expect(endpoint?.requestBody).toBeDefined();

          // 검증: content type이 존재해야 함
          const requestBody = endpoint?.requestBody as {
            content: Record<string, unknown>;
          };
          expect(requestBody.content["application/json"]).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include all response status codes", () => {
    fc.assert(
      fc.property(
        pathArb,
        fc.array(statusCodeArb, { minLength: 1, maxLength: 4 }),
        (path, statusCodes) => {
          const registry = new OpenAPIRegistry();

          // 응답 객체 생성
          const responses: Record<number, { description: string }> = {};
          const uniqueCodes = [...new Set(statusCodes)];
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

          // 검증: 모든 상태 코드가 존재해야 함
          const endpoint = spec.paths[path].get;
          uniqueCodes.forEach((code) => {
            expect(endpoint?.responses[code.toString()]).toBeDefined();
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
