import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import {
  transformOpenAPIToCategories,
  getEndpointTranslationKey,
  getTagTranslationKey,
  TranslationGetter,
} from "@/entities/api-docs/model/openapi-transformer";

// 한국어 번역 (messages/ko.json에서 가져온 값)
const koTranslations: Record<string, string> = {
  "apiDocs.tags.Projects.description": "프로젝트 관리 API",
  "apiDocs.tags.Files.description": "파일 업로드 및 관리 API",
  "apiDocs.endpoints.projects.list.summary": "프로젝트 목록 조회",
  "apiDocs.endpoints.projects.create.summary": "프로젝트 생성",
  "apiDocs.endpoints.projects.get.summary": "프로젝트 상세 조회",
  "apiDocs.endpoints.projects.delete.summary": "프로젝트 삭제",
  "apiDocs.endpoints.files.presign.summary": "Presigned URL 생성",
  "apiDocs.endpoints.files.confirm.summary": "업로드 완료 확인",
  "apiDocs.endpoints.files.delete.summary": "파일 삭제",
};

// 영어 번역 (messages/en.json에서 가져온 값)
const enTranslations: Record<string, string> = {
  "apiDocs.tags.Projects.description": "Project Management API",
  "apiDocs.tags.Files.description": "File Upload and Management API",
  "apiDocs.endpoints.projects.list.summary": "List Projects",
  "apiDocs.endpoints.projects.create.summary": "Create Project",
  "apiDocs.endpoints.projects.get.summary": "Get Project Details",
  "apiDocs.endpoints.projects.delete.summary": "Delete Project",
  "apiDocs.endpoints.files.presign.summary": "Generate Presigned URL",
  "apiDocs.endpoints.files.confirm.summary": "Confirm Upload",
  "apiDocs.endpoints.files.delete.summary": "Delete File",
};

// 번역 함수 생성
const createTranslationGetter = (
  translations: Record<string, string>
): TranslationGetter => {
  return (key: string) => translations[key] || key;
};

/**
 * **Feature: openapi-i18n, Property 1: Tag descriptions match locale**
 * *For any* locale and any tag in the API documentation, the displayed tag
 * description SHALL match the translation for that locale in the message files.
 * **Validates: Requirements 1.1, 1.2**
 */
describe("OpenAPI i18n - Tag Descriptions", () => {
  it("should return Korean tag descriptions when Korean translation is provided", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/projects",
      tags: ["Projects"],
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      tags: [{ name: "Projects", description: "Original description" }],
    });

    const t = createTranslationGetter(koTranslations);
    const categories = transformOpenAPIToCategories(spec, "ko", t);

    const projectsCategory = categories.find((c) => c.name === "Projects");
    expect(projectsCategory?.description).toBe("프로젝트 관리 API");
  });

  it("should return English tag descriptions when English translation is provided", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/projects",
      tags: ["Projects"],
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      tags: [{ name: "Projects", description: "Original description" }],
    });

    const t = createTranslationGetter(enTranslations);
    const categories = transformOpenAPIToCategories(spec, "en", t);

    const projectsCategory = categories.find((c) => c.name === "Projects");
    expect(projectsCategory?.description).toBe("Project Management API");
  });

  /**
   * Property-based test: For any tag name that has a translation,
   * the translated description should match the expected translation.
   */
  it("should translate all known tags correctly", () => {
    const tagNames = ["Projects", "Files"];

    fc.assert(
      fc.property(fc.constantFrom(...tagNames), (tagName) => {
        const registry = new OpenAPIRegistry();

        registry.registerPath({
          method: "get",
          path: `/api/v1/${tagName.toLowerCase()}`,
          tags: [tagName],
          responses: { 200: { description: "Success" } },
        });

        const generator = new OpenApiGeneratorV3(registry.definitions);
        const spec = generator.generateDocument({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
          tags: [{ name: tagName, description: "Original" }],
        });

        // Korean
        const koT = createTranslationGetter(koTranslations);
        const koCategories = transformOpenAPIToCategories(spec, "ko", koT);
        const koCategory = koCategories.find((c) => c.name === tagName);
        const expectedKo = koTranslations[`apiDocs.tags.${tagName}.description`];
        expect(koCategory?.description).toBe(expectedKo);

        // English
        const enT = createTranslationGetter(enTranslations);
        const enCategories = transformOpenAPIToCategories(spec, "en", enT);
        const enCategory = enCategories.find((c) => c.name === tagName);
        const expectedEn = enTranslations[`apiDocs.tags.${tagName}.description`];
        expect(enCategory?.description).toBe(expectedEn);
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * **Feature: openapi-i18n, Property 2: Endpoint descriptions match locale**
 * *For any* locale and any endpoint in the API documentation, the displayed
 * summary and description SHALL match the translations for that locale.
 * **Validates: Requirements 1.3, 1.4**
 */
describe("OpenAPI i18n - Endpoint Descriptions", () => {
  it("should return Korean endpoint descriptions when Korean translation is provided", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/projects",
      tags: ["Projects"],
      summary: "Original summary",
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });

    const t = createTranslationGetter(koTranslations);
    const categories = transformOpenAPIToCategories(spec, "ko", t);

    const endpoint = categories[0]?.endpoints.find(
      (e) => e.path === "/api/v1/projects" && e.method === "GET"
    );
    expect(endpoint?.description).toBe("프로젝트 목록 조회");
  });

  it("should return English endpoint descriptions when English translation is provided", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/projects",
      tags: ["Projects"],
      summary: "Original summary",
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });

    const t = createTranslationGetter(enTranslations);
    const categories = transformOpenAPIToCategories(spec, "en", t);

    const endpoint = categories[0]?.endpoints.find(
      (e) => e.path === "/api/v1/projects" && e.method === "GET"
    );
    expect(endpoint?.description).toBe("List Projects");
  });

  /**
   * Property-based test: For any known endpoint, translations should match.
   */
  it("should translate all known endpoints correctly", () => {
    const endpoints = [
      { method: "get" as const, path: "/api/v1/projects", key: "projects.list" },
      { method: "post" as const, path: "/api/v1/projects", key: "projects.create" },
      { method: "get" as const, path: "/api/v1/projects/{projectId}", key: "projects.get" },
      { method: "delete" as const, path: "/api/v1/projects/{projectId}", key: "projects.delete" },
    ];

    fc.assert(
      fc.property(fc.constantFrom(...endpoints), (ep) => {
        const registry = new OpenAPIRegistry();

        registry.registerPath({
          method: ep.method,
          path: ep.path,
          tags: ["Projects"],
          summary: "Original",
          responses: { 200: { description: "Success" } },
        });

        const generator = new OpenApiGeneratorV3(registry.definitions);
        const spec = generator.generateDocument({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        });

        // Korean
        const koT = createTranslationGetter(koTranslations);
        const koCategories = transformOpenAPIToCategories(spec, "ko", koT);
        const koEndpoint = koCategories[0]?.endpoints.find(
          (e) => e.path === ep.path && e.method === ep.method.toUpperCase()
        );
        const expectedKo = koTranslations[`apiDocs.endpoints.${ep.key}.summary`];
        expect(koEndpoint?.description).toBe(expectedKo);

        // English
        const enT = createTranslationGetter(enTranslations);
        const enCategories = transformOpenAPIToCategories(spec, "en", enT);
        const enEndpoint = enCategories[0]?.endpoints.find(
          (e) => e.path === ep.path && e.method === ep.method.toUpperCase()
        );
        const expectedEn = enTranslations[`apiDocs.endpoints.${ep.key}.summary`];
        expect(enEndpoint?.description).toBe(expectedEn);
      }),
      { numRuns: 10 }
    );
  });
});

/**
 * **Feature: openapi-i18n, Property 5: Missing translation fallback**
 * *For any* translation key that does not exist in the current locale's
 * message file, the system SHALL display the original text as fallback.
 * **Validates: Requirements 4.3**
 */
describe("OpenAPI i18n - Fallback Behavior", () => {
  it("should fall back to original description when translation is missing", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/unknown",
      tags: ["Unknown"],
      summary: "Original summary for unknown endpoint",
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      tags: [{ name: "Unknown", description: "Original tag description" }],
    });

    // 빈 번역 - 모든 키가 누락됨
    const emptyT = createTranslationGetter({});
    const categories = transformOpenAPIToCategories(spec, "ko", emptyT);

    // 태그 설명은 원본으로 폴백
    const unknownCategory = categories.find((c) => c.name === "Unknown");
    expect(unknownCategory?.description).toBe("Original tag description");

    // 엔드포인트 설명은 원본으로 폴백
    const endpoint = categories[0]?.endpoints[0];
    expect(endpoint?.description).toBe("Original summary for unknown endpoint");
  });

  it("should work without translation function (backward compatibility)", () => {
    const registry = new OpenAPIRegistry();

    registry.registerPath({
      method: "get",
      path: "/api/v1/projects",
      tags: ["Projects"],
      summary: "Original summary",
      responses: { 200: { description: "Success" } },
    });

    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
      tags: [{ name: "Projects", description: "Original description" }],
    });

    // 번역 함수 없이 호출
    const categories = transformOpenAPIToCategories(spec, "ko");

    const projectsCategory = categories.find((c) => c.name === "Projects");
    expect(projectsCategory?.description).toBe("Original description");

    const endpoint = categories[0]?.endpoints[0];
    expect(endpoint?.description).toBe("Original summary");
  });
});

/**
 * Unit tests for translation key generation utilities
 */
describe("Translation Key Utilities", () => {
  describe("getEndpointTranslationKey", () => {
    it("should generate correct translation key for known endpoints", () => {
      expect(getEndpointTranslationKey("GET", "/api/v1/projects", "summary")).toBe(
        "apiDocs.endpoints.projects.list.summary"
      );
      expect(getEndpointTranslationKey("POST", "/api/v1/projects", "summary")).toBe(
        "apiDocs.endpoints.projects.create.summary"
      );
      expect(
        getEndpointTranslationKey("GET", "/api/v1/projects/{projectId}", "description")
      ).toBe("apiDocs.endpoints.projects.get.description");
      expect(
        getEndpointTranslationKey("DELETE", "/api/v1/projects/{projectId}", "summary")
      ).toBe("apiDocs.endpoints.projects.delete.summary");
    });

    it("should return empty string for unknown endpoints", () => {
      expect(getEndpointTranslationKey("GET", "/api/v1/unknown", "summary")).toBe("");
      expect(getEndpointTranslationKey("POST", "/unknown/path", "description")).toBe("");
    });
  });

  describe("getTagTranslationKey", () => {
    it("should generate correct translation key for tags", () => {
      expect(getTagTranslationKey("Projects")).toBe("apiDocs.tags.Projects.description");
      expect(getTagTranslationKey("Files")).toBe("apiDocs.tags.Files.description");
      expect(getTagTranslationKey("Custom")).toBe("apiDocs.tags.Custom.description");
    });
  });
});
