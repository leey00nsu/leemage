import { OpenAPISpec } from "@/lib/openapi/generator";
import { ApiCategory, ApiEndpoint } from "./types";

type OpenAPIMethod = "get" | "post" | "put" | "delete" | "patch";
type UIMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  security?: Record<string, string[]>[];
  deprecated?: boolean;
  parameters?: OpenAPIParameter[];
  requestBody?: {
    content?: {
      [mediaType: string]: {
        schema?: OpenAPISchema;
      };
    };
  };
  responses?: {
    [statusCode: string]: {
      description?: string;
      content?: {
        [mediaType: string]: {
          schema?: OpenAPISchema;
        };
      };
    };
  };
}

interface OpenAPIParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;
  schema?: {
    type?: string;
  };
}

interface OpenAPISchemaProperty {
  type?: string;
  description?: string;
  example?: unknown;
  items?: { type?: string; $ref?: string };
  $ref?: string;
}

interface OpenAPISchema {
  type?: string;
  properties?: {
    [name: string]: OpenAPISchemaProperty;
  };
  required?: string[];
  $ref?: string;
  items?: { type?: string; $ref?: string };
  example?: unknown;
  allOf?: OpenAPISchema[];
}

/**
 * OpenAPI 스펙을 UI에서 사용하는 ApiCategory 형식으로 변환합니다.
 */
export function transformOpenAPIToCategories(
  spec: OpenAPISpec,
  _locale: string
): ApiCategory[] {
  const categoriesMap = new Map<string, ApiEndpoint[]>();

  // 경로별로 순회
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const methods: OpenAPIMethod[] = ["get", "post", "put", "delete", "patch"];

    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIOperation | undefined;
      if (!operation) continue;

      const tags = operation.tags || ["Default"];
      const endpoint = transformOperation(spec, path, method, operation);

      // 각 태그에 엔드포인트 추가
      for (const tag of tags) {
        if (!categoriesMap.has(tag)) {
          categoriesMap.set(tag, []);
        }
        categoriesMap.get(tag)!.push(endpoint);
      }
    }
  }

  // 카테고리 배열로 변환
  const categories: ApiCategory[] = [];
  const tagDescriptions = getTagDescriptions(spec);

  for (const [tagName, endpoints] of categoriesMap) {
    categories.push({
      name: tagName,
      description: tagDescriptions.get(tagName) || "",
      endpoints,
    });
  }

  return categories;
}

/**
 * OpenAPI operation을 ApiEndpoint로 변환합니다.
 */
function transformOperation(
  spec: OpenAPISpec,
  path: string,
  method: OpenAPIMethod,
  operation: OpenAPIOperation
): ApiEndpoint {
  const hasAuth =
    operation.security && operation.security.length > 0;

  return {
    method: method.toUpperCase() as UIMethod,
    path: path,
    description: operation.summary || operation.description || "",
    auth: hasAuth ?? false,
    deprecated: operation.deprecated,
    parameters: transformParameters(operation.parameters),
    requestBody: transformRequestBody(spec, operation.requestBody),
    responses: transformResponses(spec, operation.responses),
  };
}

/**
 * 파라미터 변환
 */
function transformParameters(
  parameters?: OpenAPIParameter[]
): ApiEndpoint["parameters"] {
  if (!parameters || parameters.length === 0) return undefined;

  return parameters
    .filter((p) => p.in === "path" || p.in === "query")
    .map((p) => ({
      name: p.name,
      type: p.schema?.type || "string",
      required: p.required ?? false,
      description: p.description || "",
    }));
}

/**
 * Request body 변환
 */
function transformRequestBody(
  spec: OpenAPISpec,
  requestBody?: OpenAPIOperation["requestBody"]
): ApiEndpoint["requestBody"] {
  if (!requestBody?.content) return undefined;

  const jsonContent = requestBody.content["application/json"];
  if (!jsonContent?.schema) return undefined;

  const schema = resolveSchema(spec, jsonContent.schema);
  if (!schema?.properties) return undefined;

  const properties = Object.entries(schema.properties).map(([name, prop]) => ({
    name,
    type: getPropertyType(prop),
    required: schema.required?.includes(name) ?? false,
    description: prop.description || "",
  }));

  return {
    type: "object",
    properties,
  };
}

/**
 * 응답 변환
 */
function transformResponses(
  spec: OpenAPISpec,
  responses?: OpenAPIOperation["responses"]
): ApiEndpoint["responses"] {
  if (!responses) return [];

  return Object.entries(responses).map(([statusCode, response]) => {
    const jsonContent = response.content?.["application/json"];
    const schema = jsonContent?.schema
      ? resolveSchema(spec, jsonContent.schema)
      : undefined;

    return {
      status: parseInt(statusCode, 10),
      description: response.description || "",
      example: generateExample(spec, schema),
    };
  });
}

/**
 * $ref를 해결하여 실제 스키마를 반환합니다.
 * allOf가 있는 경우 모든 스키마를 병합합니다.
 */
function resolveSchema(
  spec: OpenAPISpec,
  schema: OpenAPISchema
): OpenAPISchema | undefined {
  if (schema.$ref) {
    const refPath = schema.$ref.replace("#/components/schemas/", "");
    const resolved = spec.components?.schemas?.[refPath] as
      | OpenAPISchema
      | undefined;
    // 참조된 스키마도 allOf를 가질 수 있으므로 재귀 처리
    return resolved ? resolveSchema(spec, resolved) : undefined;
  }

  // allOf 처리: 모든 스키마를 병합
  if (schema.allOf && schema.allOf.length > 0) {
    const merged: OpenAPISchema = {
      type: "object",
      properties: {},
      required: [],
    };

    for (const subSchema of schema.allOf) {
      const resolved = resolveSchema(spec, subSchema);
      if (resolved?.properties) {
        merged.properties = { ...merged.properties, ...resolved.properties };
      }
      if (resolved?.required) {
        merged.required = [...(merged.required || []), ...resolved.required];
      }
    }

    return merged;
  }

  return schema;
}

/**
 * 프로퍼티 타입 문자열 생성
 */
function getPropertyType(prop: OpenAPISchemaProperty): string {
  if (prop.$ref) {
    return prop.$ref.replace("#/components/schemas/", "");
  }
  if (prop.type === "array") {
    if (prop.items?.$ref) {
      return `${prop.items.$ref.replace("#/components/schemas/", "")}[]`;
    }
    return `${prop.items?.type || "any"}[]`;
  }
  return prop.type || "any";
}

/**
 * 스키마에서 예제 생성
 */
function generateExample(
  spec: OpenAPISpec,
  schema?: OpenAPISchema
): unknown {
  if (!schema) return {};

  // 스키마에 example이 있으면 사용
  if (schema.example !== undefined) {
    return schema.example;
  }

  // 배열 타입 처리
  if (schema.type === "array" && schema.items) {
    const itemSchema = schema.items.$ref
      ? resolveSchema(spec, { $ref: schema.items.$ref })
      : (schema.items as OpenAPISchema);
    const itemExample = generateExample(spec, itemSchema);
    return [itemExample];
  }

  // 프로퍼티별 example 조합
  if (schema.properties) {
    const example: Record<string, unknown> = {};
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (prop.example !== undefined) {
        example[name] = prop.example;
      } else if (prop.$ref) {
        const refSchema = resolveSchema(spec, { $ref: prop.$ref });
        example[name] = generateExample(spec, refSchema);
      } else if (prop.type === "string") {
        example[name] = "";
      } else if (prop.type === "number" || prop.type === "integer") {
        example[name] = 0;
      } else if (prop.type === "boolean") {
        example[name] = false;
      } else if (prop.type === "array") {
        // 배열 프로퍼티의 items 처리
        if (prop.items?.$ref) {
          const itemSchema = resolveSchema(spec, { $ref: prop.items.$ref });
          example[name] = [generateExample(spec, itemSchema)];
        } else {
          example[name] = [];
        }
      } else {
        example[name] = null;
      }
    }
    return example;
  }

  return {};
}

/**
 * 태그 설명 맵 생성
 */
function getTagDescriptions(spec: OpenAPISpec): Map<string, string> {
  const map = new Map<string, string>();
  if (spec.tags) {
    for (const tag of spec.tags) {
      map.set(tag.name, tag.description || "");
    }
  }
  return map;
}
