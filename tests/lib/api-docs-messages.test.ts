import { expect, it, vi } from "vitest";
import { createTranslator } from "next-intl";
import ko from "@/messages/ko.json";
import en from "@/messages/en.json";
import "@/lib/openapi";
import { generateOpenAPISpec } from "@/lib/openapi/generator";
import { transformOpenAPIToCategories } from "@/entities/api-docs/model/openapi-transformer";
import { createApiDocsTranslator } from "@/entities/api-docs/model/translation";

for (const [locale, messages] of Object.entries({ ko, en })) {
  it(`${locale}: all translation keys used by the real OpenAPI document exist`, () => {
    const onError = vi.fn();
    const translator = createTranslator({
      locale,
      messages,
      onError,
    }) as unknown as Parameters<typeof createApiDocsTranslator>[0];
    const visited = new Set<string>();
    const categories = transformOpenAPIToCategories(
      generateOpenAPISpec(),
      locale,
      (key) => {
        visited.add(key);
        expect(
          translator.has(key),
          `Missing translation: ${locale}:${key}`,
        ).toBe(true);
        return translator(key);
      },
    );
    expect(categories.length).toBeGreaterThan(0);
    expect(visited.has("apiDocs.schemas.project.maxUploadBytes")).toBe(true);
    expect(visited.has("apiDocs.schemas.project.videoThumbnailEnabled")).toBe(
      true,
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it(`${locale}: unknown fields retain their OpenAPI description without next-intl errors`, () => {
    const onError = vi.fn();
    const t = createTranslator({
      locale,
      messages,
      onError,
    }) as unknown as Parameters<typeof createApiDocsTranslator>[0];
    const spec = generateOpenAPISpec();
    const schema = spec.components!.schemas!.CreateProjectRequest;
    if (!("properties" in schema)) throw new Error("Expected project schema");
    schema.properties!.futureSetting = {
      type: "string",
      description: "Future option description",
    };
    const categories = transformOpenAPIToCategories(
      spec,
      locale,
      createApiDocsTranslator(t),
    );
    const create = categories
      .flatMap((category) => category.endpoints)
      .find(
        (endpoint) =>
          endpoint.method === "POST" &&
          endpoint.fullPath === "/api/v1/projects",
      );
    expect(
      create?.requestBody?.properties.find(
        (property) => property.name === "futureSetting",
      )?.description,
    ).toBe("Future option description");
    expect(onError).not.toHaveBeenCalled();
  });
}
