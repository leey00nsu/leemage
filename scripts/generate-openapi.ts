/**
 * OpenAPI YAML 생성 스크립트
 * 빌드 시 실행하여 public/openapi.yaml 파일을 생성합니다.
 *
 * 사용법: npx tsx scripts/generate-openapi.ts
 */

import { writeFileSync } from "fs";
import { stringify } from "yaml";

// OpenAPI 모듈 import (side effects로 스키마/엔드포인트 등록)
import "../lib/openapi/index";
import { generateOpenAPISpec } from "../lib/openapi/generator";

const OUTPUT_PATH = "public/openapi.yaml";

async function main() {
  console.log("Generating OpenAPI spec...");

  // OpenAPI 스펙 생성
  const spec = generateOpenAPISpec();

  // 경로를 /api/v1 prefix로 변환
  const specWithPrefix = {
    ...spec,
    paths: Object.fromEntries(
      Object.entries(spec.paths).map(([path, pathItem]) => [
        `/api/v1${path}`,
        pathItem,
      ])
    ),
  };

  // YAML로 변환
  const yamlContent = stringify(specWithPrefix, {
    indent: 2,
    lineWidth: 0, // 줄바꿈 없이
  });

  // 파일 저장
  writeFileSync(OUTPUT_PATH, yamlContent, "utf-8");

  console.log(`OpenAPI spec generated: ${OUTPUT_PATH}`);
  console.log(
    `Endpoints: ${Object.keys(specWithPrefix.paths).length} paths registered`
  );
}

main().catch((error) => {
  console.error("Failed to generate OpenAPI spec:", error);
  process.exit(1);
});
