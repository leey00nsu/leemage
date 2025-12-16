import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Zod에 OpenAPI 확장 메서드 추가
// 이 파일은 앱 시작 시 한 번만 import되어야 함
extendZodWithOpenApi(z);

export { z };
