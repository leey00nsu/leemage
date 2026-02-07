import { OpenAPISpec } from "@/lib/openapi/generator";
import { ApiCategory, ApiEndpoint } from "./types";
import { getRequiredPermissionForMethod } from "@/shared/config/api-key-permissions";

type OpenAPIMethod = "get" | "post" | "put" | "delete" | "patch";
type UIMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

/**
 * 번역 함수 타입
 */
export type TranslationGetter = (key: string) => string;

/**
 * Operation ID 매핑 - HTTP 메서드와 경로를 번역 키로 변환
 */
const OPERATION_ID_MAP: Record<string, string> = {
  "GET /api/v1/projects": "projects.list",
  "POST /api/v1/projects": "projects.create",
  "GET /api/v1/projects/{projectId}": "projects.get",
  "DELETE /api/v1/projects/{projectId}": "projects.delete",
  "POST /api/v1/projects/{projectId}/files/presign": "files.presign",
  "POST /api/v1/projects/{projectId}/files/confirm": "files.confirm",
  "DELETE /api/v1/projects/{projectId}/files/{fileId}": "files.delete",
};

/**
 * 엔드포인트의 번역 키를 생성합니다.
 */
export function getEndpointTranslationKey(
  method: string,
  path: string,
  field: "summary" | "description"
): string {
  const key = `${method.toUpperCase()} ${path}`;
  const operationId = OPERATION_ID_MAP[key];
  if (operationId) {
    return `apiDocs.endpoints.${operationId}.${field}`;
  }
  return "";
}

/**
 * 태그의 번역 키를 생성합니다.
 */
export function getTagTranslationKey(tagName: string): string {
  return `apiDocs.tags.${tagName}.description`;
}

/**
 * 스키마 필드의 번역 키를 생성합니다.
 */
export function getSchemaFieldTranslationKey(
  schemaName: string,
  fieldName: string
): string {
  return `apiDocs.schemas.${schemaName}.${fieldName}`;
}

/**
 * 스키마 이름과 필드 이름으로 번역 키 매핑
 * OpenAPI 스키마 이름 -> 번역 키 스키마 이름
 */
const SCHEMA_NAME_MAP: Record<string, string> = {
  CreateProjectRequest: "project",
  UpdateProjectRequest: "project",
  ProjectResponse: "project",
  ProjectDetailsResponse: "project",
  PresignRequest: "presign",
  PresignResponse: "presign",
  ConfirmRequest: "confirm",
  ConfirmResponse: "file",
  FileResponse: "file",
  VariantOption: "variant",
  ImageVariantData: "variant",
};

/**
 * 공통 필드 매핑 (여러 스키마에서 공유되는 필드)
 */
const COMMON_FIELDS = ["id", "name", "description", "createdAt", "updatedAt"];

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
  items?: { type?: string; $ref?: string; enum?: string[] };
  $ref?: string;
  enum?: string[];
  anyOf?: OpenAPISchemaProperty[];
  pattern?: string;
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
  _locale: string,
  t?: TranslationGetter
): ApiCategory[] {
  const categoriesMap = new Map<string, ApiEndpoint[]>();

  // 경로별로 순회
  for (const [path, pathItem] of Object.entries(spec.paths || {})) {
    const methods: OpenAPIMethod[] = ["get", "post", "put", "delete", "patch"];

    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIOperation | undefined;
      if (!operation) continue;

      const tags = operation.tags || ["Default"];
      const endpoint = transformOperation(spec, path, method, operation, t);

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
  const tagDescriptions = getTagDescriptions(spec, t);

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
  operation: OpenAPIOperation,
  t?: TranslationGetter
): ApiEndpoint {
  const hasAuth = operation.security && operation.security.length > 0;
  const normalizedMethod = method.toUpperCase() as UIMethod;
  const requiredPermission = hasAuth
    ? getRequiredPermissionForMethod(normalizedMethod)
    : null;

  // 엔드포인트 설명 번역
  const summaryKey = getEndpointTranslationKey(method, path, "summary");
  const descriptionKey = getEndpointTranslationKey(method, path, "description");

  let description = operation.summary || operation.description || "";
  if (t && summaryKey) {
    const translatedSummary = t(summaryKey);
    // 번역 키가 그대로 반환되지 않으면 번역 사용
    if (translatedSummary !== summaryKey) {
      description = translatedSummary;
    }
  }

  return {
    method: normalizedMethod,
    path: path,
    description,
    auth: hasAuth ?? false,
    requiredPermission,
    deprecated: operation.deprecated,
    parameters: transformParameters(operation.parameters),
    requestBody: transformRequestBody(spec, operation.requestBody, t),
    responses: transformResponses(spec, operation.responses, t),
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
      location: p.in,
      type: p.schema?.type || "string",
      required: p.required ?? false,
      description: p.description || "",
    }));
}

/**
 * Request body 변환 (번역 적용)
 */
function transformRequestBody(
  spec: OpenAPISpec,
  requestBody?: OpenAPIOperation["requestBody"],
  t?: TranslationGetter
): ApiEndpoint["requestBody"] {
  if (!requestBody?.content) return undefined;

  const jsonContent = requestBody.content["application/json"];
  if (!jsonContent?.schema) return undefined;

  // 스키마 이름 추출 (번역 키 생성용)
  const schemaRef = jsonContent.schema.$ref;
  const schemaName = schemaRef
    ? schemaRef.replace("#/components/schemas/", "")
    : undefined;

  const schema = resolveSchema(spec, jsonContent.schema);
  if (!schema?.properties) return undefined;

  const properties = Object.entries(schema.properties).map(([name, prop]) => {
    let description = prop.description || "";

    // 번역 적용
    if (t && schemaName) {
      const translatedSchemaName = SCHEMA_NAME_MAP[schemaName];
      if (translatedSchemaName) {
        // 공통 필드인지 확인
        const isCommonField = COMMON_FIELDS.includes(name);
        const translationKey = isCommonField
          ? getSchemaFieldTranslationKey("common", name)
          : getSchemaFieldTranslationKey(translatedSchemaName, name);

        const translated = t(translationKey);
        if (translated !== translationKey) {
          description = translated;
        }
      }
    }

    return {
      name,
      type: getPropertyType(prop),
      required: schema.required?.includes(name) ?? false,
      description,
    };
  });

  return {
    type: "object",
    properties,
  };
}

/**
 * 응답 변환 (번역 적용)
 */
function transformResponses(
  spec: OpenAPISpec,
  responses?: OpenAPIOperation["responses"],
  t?: TranslationGetter
): ApiEndpoint["responses"] {
  if (!responses) return [];

  return Object.entries(responses).map(([statusCode, response]) => {
    const jsonContent = response.content?.["application/json"];
    const schema = jsonContent?.schema
      ? resolveSchema(spec, jsonContent.schema)
      : undefined;

    // 응답 설명 번역
    let description = response.description || "";
    if (t) {
      // 응답 설명 번역 매핑 (한글 원본 -> 번역 키)
      const responseDescriptionMap: Record<string, string> = {
        // 에러 응답
        "인증 실패": "apiDocs.errors.unauthorized",
        "프로젝트를 찾을 수 없음": "apiDocs.errors.notFound.project",
        "파일을 찾을 수 없음": "apiDocs.errors.notFound.file",
        "잘못된 요청": "apiDocs.errors.badRequest",
        "서버 오류": "apiDocs.errors.serverError",
        // 성공 응답
        "프로젝트 목록이 성공적으로 반환됩니다.":
          "apiDocs.responses.projectListSuccess",
        "프로젝트가 성공적으로 생성되었습니다.":
          "apiDocs.responses.projectCreated",
        "프로젝트가 성공적으로 반환됩니다.":
          "apiDocs.responses.projectGetSuccess",
        "프로젝트가 성공적으로 삭제되었습니다.":
          "apiDocs.responses.projectDeleted",
        "Presigned URL이 성공적으로 생성되었습니다.":
          "apiDocs.responses.presignSuccess",
        "파일 레코드가 성공적으로 생성되었습니다.":
          "apiDocs.responses.confirmSuccess",
        "파일 삭제 성공": "apiDocs.responses.fileDeleted",
      };

      const translationKey = responseDescriptionMap[description];
      if (translationKey) {
        const translated = t(translationKey);
        if (translated !== translationKey) {
          description = translated;
        }
      }
    }

    return {
      status: parseInt(statusCode, 10),
      description,
      example: generateExample(spec, schema, t),
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

  // enum 처리
  if (prop.enum && prop.enum.length > 0) {
    return prop.enum.map((v) => `"${v}"`).join(" | ");
  }

  // anyOf 처리 (enum + pattern 조합 등)
  if (prop.anyOf && prop.anyOf.length > 0) {
    const enumValues: string[] = [];
    let hasPattern = false;
    for (const subProp of prop.anyOf) {
      if (subProp.enum) {
        enumValues.push(...subProp.enum);
      }
      if (subProp.pattern) {
        hasPattern = true;
      }
    }
    if (enumValues.length > 0) {
      const enumStr = enumValues.map((v) => `"${v}"`).join(" | ");
      return hasPattern ? `${enumStr} | string` : enumStr;
    }
  }

  if (prop.type === "array") {
    if (prop.items?.$ref) {
      return `${prop.items.$ref.replace("#/components/schemas/", "")}[]`;
    }
    if (prop.items?.enum) {
      return `(${prop.items.enum.map((v) => `"${v}"`).join(" | ")})[]`;
    }
    return `${prop.items?.type || "any"}[]`;
  }
  return prop.type || "any";
}

const EXAMPLE_TEXT_TRANSLATIONS: Record<string, string> = {
  "인증 실패: 유효하지 않은 API 키": "apiDocs.errors.unauthorized",
  "프로젝트를 찾을 수 없습니다.": "apiDocs.errors.notFound.project",
  "프로젝트를 찾을 수 없음": "apiDocs.errors.notFound.project",
  "파일을 찾을 수 없습니다.": "apiDocs.errors.notFound.file",
  "파일을 찾을 수 없음": "apiDocs.errors.notFound.file",
  "잘못된 요청 형식입니다.": "apiDocs.errors.badRequest",
  "요청 처리 중 오류가 발생했습니다.": "apiDocs.errors.badRequest",
  "서버 오류가 발생했습니다.": "apiDocs.errors.serverError",
  "필수 항목입니다.": "apiDocs.errors.validationError",
  "작업이 완료되었습니다.": "apiDocs.responses.success",
  "파일 업로드 완료": "apiDocs.responses.fileUploadComplete",
};

function translateExampleString(
  value: string,
  t?: TranslationGetter
): string {
  if (!t) return value;

  const translationKey = EXAMPLE_TEXT_TRANSLATIONS[value];
  if (!translationKey) return value;

  const translated = t(translationKey);
  return translated !== translationKey ? translated : value;
}

function localizeExampleValue(
  value: unknown,
  t?: TranslationGetter
): unknown {
  if (typeof value === "string") {
    return translateExampleString(value, t);
  }

  if (Array.isArray(value)) {
    return value.map((item) => localizeExampleValue(item, t));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        localizeExampleValue(item, t),
      ])
    );
  }

  return value;
}

/**
 * 스키마에서 예제 생성 (번역 적용)
 */
function generateExample(
  spec: OpenAPISpec,
  schema?: OpenAPISchema,
  t?: TranslationGetter
): unknown {
  if (!schema) return {};

  // 스키마에 example이 있으면 사용 (에러 메시지 번역 적용)
  if (schema.example !== undefined) {
    return localizeExampleValue(schema.example, t);
  }

  // 배열 타입 처리
  if (schema.type === "array" && schema.items) {
    const itemSchema = schema.items.$ref
      ? resolveSchema(spec, { $ref: schema.items.$ref })
      : (schema.items as OpenAPISchema);
    const itemExample = generateExample(spec, itemSchema, t);
    return [itemExample];
  }

  // 프로퍼티별 example 조합
  if (schema.properties) {
    const example: Record<string, unknown> = {};
    for (const [name, prop] of Object.entries(schema.properties)) {
      if (prop.example !== undefined) {
        example[name] = localizeExampleValue(prop.example, t);
      } else if (prop.$ref) {
        const refSchema = resolveSchema(spec, { $ref: prop.$ref });
        example[name] = generateExample(spec, refSchema, t);
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
          example[name] = [generateExample(spec, itemSchema, t)];
        } else {
          example[name] = [];
        }
      } else {
        example[name] = null;
      }
    }
    return localizeExampleValue(example, t);
  }

  return {};
}

/**
 * 태그 설명 맵 생성 (번역 적용)
 */
function getTagDescriptions(
  spec: OpenAPISpec,
  t?: TranslationGetter
): Map<string, string> {
  const map = new Map<string, string>();
  if (spec.tags) {
    for (const tag of spec.tags) {
      const translationKey = getTagTranslationKey(tag.name);
      // 번역 함수가 있으면 번역 시도, 없으면 원본 사용
      const translatedDescription = t
        ? t(translationKey)
        : tag.description || "";
      // 번역 키가 그대로 반환되면 원본 사용 (번역 없음)
      const description =
        translatedDescription === translationKey
          ? tag.description || ""
          : translatedDescription;
      map.set(tag.name, description);
    }
  }
  return map;
}
