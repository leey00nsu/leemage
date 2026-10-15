import { expect, it } from "vitest";
import "@/lib/openapi/index";
import { generateOpenAPISpec } from "@/lib/openapi/generator";
import { transformOpenAPIToCategories } from "@/entities/api-docs/model/openapi-transformer";

it("documents the batch limit and shows delete permission for the POST endpoint", () => {
  const spec = generateOpenAPISpec();
  const schema = spec.components?.schemas?.DeleteFilesRequest;
  expect(schema).toMatchObject({ properties: { fileIds: { minItems: 1, maxItems: 100 } } });
  const endpoint = transformOpenAPIToCategories(spec, "en")
    .flatMap((category) => category.endpoints)
    .find((item) => item.path === "/projects/{projectId}/files/bulk-delete");
  expect(endpoint).toMatchObject({ method: "POST", requiredPermission: "delete" });
});
