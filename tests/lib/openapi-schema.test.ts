import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

// Zod에 OpenAPI 확장 추가
extendZodWithOpenApi(z);

describe("OpenAPI 스키마 변환", () => {
  // 프로퍼티 이름 생성기
  const propertyNameArb = fc.stringMatching(/^[a-z][a-zA-Z0-9]*$/);

  // 설명 생성기
  const descriptionArb = fc.string({ minLength: 1, maxLength: 50 });

  it("생성된 스키마에 속성 설명을 보존해야 한다", () => {
    fc.assert(
      fc.property(propertyNameArb, descriptionArb, (propName, description) => {
        const registry = new OpenAPIRegistry();

        // OpenAPI 확장이 있는 스키마 생성
        const schema = z.object({
          [propName]: z.string().openapi({ description }),
        });

        registry.register("TestSchema", schema);

        // 스펙 생성
        const generator = new OpenApiGeneratorV3(registry.definitions);
        const spec = generator.generateDocument({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        });

        // 검증: 스키마가 존재해야 함
        expect(spec.components?.schemas?.TestSchema).toBeDefined();

        // 검증: 프로퍼티 설명이 보존되어야 함
        const generatedSchema = spec.components?.schemas?.TestSchema as {
          properties: Record<string, { description?: string }>;
        };
        expect(generatedSchema.properties[propName]?.description).toBe(
          description,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("생성된 스키마에 예제 값을 보존해야 한다", () => {
    fc.assert(
      fc.property(propertyNameArb, fc.string(), (propName, example) => {
        const registry = new OpenAPIRegistry();

        // 예제가 있는 스키마 생성
        const schema = z.object({
          [propName]: z.string().openapi({ example }),
        });

        registry.register("TestSchema", schema);

        // 스펙 생성
        const generator = new OpenApiGeneratorV3(registry.definitions);
        const spec = generator.generateDocument({
          openapi: "3.0.0",
          info: { title: "Test API", version: "1.0.0" },
        });

        // 검증: 예제가 보존되어야 함
        const generatedSchema = spec.components?.schemas?.TestSchema as {
          properties: Record<string, { example?: string }>;
        };
        expect(generatedSchema.properties[propName]?.example).toBe(example);
      }),
      { numRuns: 100 },
    );
  });

  it("Zod 타입을 OpenAPI 타입으로 올바르게 매핑해야 한다", () => {
    const registry = new OpenAPIRegistry();

    // 다양한 타입의 스키마 생성
    const schema = z.object({
      stringProp: z.string(),
      numberProp: z.number(),
      booleanProp: z.boolean(),
      arrayProp: z.array(z.string()),
      optionalProp: z.string().optional(),
    });

    registry.register("TypeTestSchema", schema);

    // 스펙 생성
    const generator = new OpenApiGeneratorV3(registry.definitions);
    const spec = generator.generateDocument({
      openapi: "3.0.0",
      info: { title: "Test API", version: "1.0.0" },
    });

    const generatedSchema = spec.components?.schemas?.TypeTestSchema as {
      properties: Record<string, { type?: string; items?: { type: string } }>;
      required?: string[];
    };

    // 검증: 타입 매핑이 올바른지 확인
    expect(generatedSchema.properties.stringProp?.type).toBe("string");
    expect(generatedSchema.properties.numberProp?.type).toBe("number");
    expect(generatedSchema.properties.booleanProp?.type).toBe("boolean");
    expect(generatedSchema.properties.arrayProp?.type).toBe("array");
    expect(generatedSchema.properties.arrayProp?.items?.type).toBe("string");

    // 검증: required 필드가 올바른지 확인
    expect(generatedSchema.required).toContain("stringProp");
    expect(generatedSchema.required).toContain("numberProp");
    expect(generatedSchema.required).toContain("booleanProp");
    expect(generatedSchema.required).toContain("arrayProp");
    expect(generatedSchema.required).not.toContain("optionalProp");
  });
});
