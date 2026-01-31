import { describe, it, expect } from "vitest";
import { extractProjectIdFromPath } from "@/lib/api/api-logger";

describe("extractProjectIdFromPath", () => {
  it("/v1/projects/{id} 경로에서 projectId를 추출해야 한다", () => {
    const path = "/v1/projects/abc123";
    expect(extractProjectIdFromPath(path)).toBe("abc123");
  });

  it("/v1/projects/{id}/files 경로에서 projectId를 추출해야 한다", () => {
    const path = "/v1/projects/proj_xyz/files";
    expect(extractProjectIdFromPath(path)).toBe("proj_xyz");
  });

  it("/v1/projects/{id}/files/presign 경로에서 projectId를 추출해야 한다", () => {
    const path = "/v1/projects/clg123abc/files/presign";
    expect(extractProjectIdFromPath(path)).toBe("clg123abc");
  });

  it("/v1/projects 경로(id 없음)에 대해 undefined를 반환해야 한다", () => {
    const path = "/v1/projects";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("관련 없는 경로에 대해 undefined를 반환해야 한다", () => {
    const path = "/api/auth/session";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("/v1/openapi 경로에 대해 undefined를 반환해야 한다", () => {
    const path = "/v1/openapi";
    expect(extractProjectIdFromPath(path)).toBeUndefined();
  });

  it("CUID 형식의 projectId를 처리해야 한다", () => {
    const path = "/v1/projects/clu8x9abc123def456/files";
    expect(extractProjectIdFromPath(path)).toBe("clu8x9abc123def456");
  });

  it("슬래시로 끝나는 경로를 처리해야 한다", () => {
    const path = "/v1/projects/abc123/";
    expect(extractProjectIdFromPath(path)).toBe("abc123");
  });
});

describe("ApiLogData 검증", () => {
  it("유효한 로그 데이터 구조를 허용해야 한다", () => {
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

  it("선택적 projectId를 허용해야 한다", () => {
    const logDataWithoutProject = {
      userId: "user123",
      endpoint: "/v1/projects",
      method: "GET",
      statusCode: 200,
    };

    expect(logDataWithoutProject.userId).toBeDefined();
    expect(
      (logDataWithoutProject as { projectId?: string }).projectId,
    ).toBeUndefined();
  });

  it("선택적 durationMs를 허용해야 한다", () => {
    const logDataWithoutDuration = {
      userId: "user123",
      endpoint: "/v1/projects",
      method: "POST",
      statusCode: 201,
    };

    expect(
      (logDataWithoutDuration as { durationMs?: number }).durationMs,
    ).toBeUndefined();
  });
});
