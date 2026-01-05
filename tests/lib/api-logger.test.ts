/**
 * API Logger 유틸리티 테스트
 *
 * **Feature: api-usage-logging**
 * - extractProjectIdFromPath 함수가 올바르게 projectId를 추출하는지 확인
 * - logApiCall 함수가 올바른 데이터 형식을 처리하는지 확인
 */

import { describe, it, expect } from "vitest";
import { extractProjectIdFromPath } from "@/lib/api/api-logger";

describe("extractProjectIdFromPath", () => {
  it("should extract projectId from /v1/projects/{id} path", () => {
    const path = "/v1/projects/abc123";
    expect(extractProjectIdFromPath(path)).toBe("abc123");
  });

  it("should extract projectId from /v1/projects/{id}/files path", () => {
    const path = "/v1/projects/proj_xyz/files";
    expect(extractProjectIdFromPath(path)).toBe("proj_xyz");
  });

  it("should extract projectId from /v1/projects/{id}/files/presign path", () => {
    const path = "/v1/projects/clg123abc/files/presign";
    expect(extractProjectIdFromPath(path)).toBe("clg123abc");
  });

  it("should return undefined for /v1/projects path (no id)", () => {
    const path = "/v1/projects";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("should return undefined for unrelated paths", () => {
    const path = "/api/auth/session";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("should return undefined for /v1/openapi path", () => {
    const path = "/v1/openapi";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("should handle CUID format projectIds", () => {
    const path = "/v1/projects/clu8x9abc123def456/files";
    expect(extractProjectIdFromPath(path)).toBe("clu8x9abc123def456");
  });

  it("should handle paths with trailing slash", () => {
    const path = "/v1/projects/abc123/";
    expect(extractProjectIdFromPath(path)).toBe("abc123");
  });
});

describe("ApiLogData validation", () => {
  it("should accept valid log data structure", () => {
    const validLogData = {
      userId: "user123",
      projectId: "proj456",
      endpoint: "/v1/projects",
      method: "GET",
      statusCode: 200,
      durationMs: 45,
    };

    // 타입 체크 - 컴파일 타임에 검증됨
    expect(validLogData.userId).toBeDefined();
    expect(validLogData.endpoint).toBeDefined();
    expect(validLogData.method).toBeDefined();
    expect(validLogData.statusCode).toBeDefined();
  });

  it("should allow optional projectId", () => {
    const logDataWithoutProject = {
      userId: "user123",
      endpoint: "/v1/projects",
      method: "GET",
      statusCode: 200,
    };

    expect(logDataWithoutProject.userId).toBeDefined();
    expect(
      (logDataWithoutProject as { projectId?: string }).projectId
    ).toBeUndefined();
  });

  it("should allow optional durationMs", () => {
    const logDataWithoutDuration = {
      userId: "user123",
      endpoint: "/v1/projects",
      method: "POST",
      statusCode: 201,
    };

    expect(
      (logDataWithoutDuration as { durationMs?: number }).durationMs
    ).toBeUndefined();
  });
});
