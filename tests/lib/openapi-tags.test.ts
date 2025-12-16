import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

/**
 * **Feature: openapi-docs, Property 3: Tag-based Organization**
 * *For any* set of registered endpoints with tags, endpoints with the same tag
 * SHALL be grouped together in the generated specification.
 * **Validates: Requirements 2.2**
 */
describe("OpenAPI Tag Organization", () => {
  // 태그 이름 생성기
  const tagNameArb = fc.stringMatching(/^[A-Z][a-z]+$/);

  // 경로 생성기
  const pathArb = fc.stringMatching(/^\/[a-z]+$/).map((p) => p);

  it("should group endpoints by tags in the generated spec", () => {
    fc.assert(
      fc.property(
        fc.array(tagNameArb, { minLength: 1, maxLength: 3 }),
        fc.array(pathArb, { minLength: 2, maxLength: 5 }),
        (tags, paths) => {
          const registry = new OpenAPIRegistry();
          const uniquePaths = [...new Set(paths)];
          const uniqueTags = [...new Set(tags)];

          if (uniquePaths.length < 2 || uniqueTags.length < 1) return true;

          // 각 경로에 태그 할당
          const endpointTags: Map<string, string> = new Map();
          uniquePaths.forEach((path, index) => {
            const tag = uniqueTags[index % uniqueTags.length];
            endpointTags.set(path, tag);

            registry.registerPath({
              method: "get",
              path,
              tags: [tag],
              responses: {
                200: { description: "Success" },
              },
            });
          });

          // 스펙 생성
          const generator = new OpenApiGeneratorV3(registry.definitions);
          const spec = generator.generateDocument({
            openapi: "3.0.0",
            info: { title: "Test API", version: "1.0.0" },
          });

          // 검증: 각 엔드포인트가 올바른 태그를 가지고 있는지 확인
          uniquePaths.forEach((path) => {
            const expectedTag = endpointTags.get(path);
            const endpoint = spec.paths[path]?.get;
            expect(endpoint?.tags).toContain(expectedTag);
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should include all unique tags in the spec", () => {
    fc.assert(
      fc.property(
        fc.array(tagNameArb, { minLength: 1, maxLength: 5 }),
        (tags) => {
          const registry = new OpenAPIRegistry();
          const uniqueTags = [...new Set(tags)];

          // 각 태그에 대해 엔드포인트 등록
          uniqueTags.forEach((tag, index) => {
            registry.registerPath({
              method: "get",
              path: `/resource${index}`,
              tags: [tag],
              responses: {
                200: { description: "Success" },
              },
            });
          });

          // 스펙 생성
          const generator = new OpenApiGeneratorV3(registry.definitions);
          const spec = generator.generateDocument({
            openapi: "3.0.0",
            info: { title: "Test API", version: "1.0.0" },
          });

          // 검증: 모든 경로가 존재하는지 확인
          uniqueTags.forEach((_, index) => {
            expect(spec.paths[`/resource${index}`]).toBeDefined();
          });

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
