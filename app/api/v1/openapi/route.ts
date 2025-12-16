import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

/**
 * GET /api/v1/openapi
 * OpenAPI 스펙을 YAML 형식으로 반환합니다.
 */
export async function GET() {
  const yamlPath = join(process.cwd(), "public", "openapi.yaml");

  if (!existsSync(yamlPath)) {
    return NextResponse.json(
      { message: "OpenAPI spec not found. Run 'npm run openapi:generate' first." },
      { status: 404 }
    );
  }

  const yamlContent = readFileSync(yamlPath, "utf-8");

  return new NextResponse(yamlContent, {
    status: 200,
    headers: {
      "Content-Type": "application/x-yaml",
      "Content-Disposition": "inline; filename=openapi.yaml",
    },
  });
}
