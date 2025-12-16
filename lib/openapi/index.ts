// OpenAPI 설정 및 Zod 확장
import "./setup";

// 스키마 등록
import "./schemas/common";
import "./schemas/files";
import "./schemas/projects";

// 엔드포인트 등록
import "./endpoints/projects";
import "./endpoints/files";

// 생성기 및 레지스트리 export
export { registry } from "./registry";
export { generateOpenAPISpec, generateOpenAPISpecJSON } from "./generator";
export type { OpenAPISpec } from "./generator";
