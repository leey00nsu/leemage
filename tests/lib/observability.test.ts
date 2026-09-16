import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  observeDependency,
  observeHttpRequest,
  renderMetrics,
  resetMetricsForTests,
} from "@/lib/observability/metrics";
import {
  getOrCreateRequestId,
  normalizeApiRoute,
} from "@/lib/observability/request-id";
import { completeRequest } from "@/lib/observability/request";
import { GET as getMetrics } from "@/app/api/metrics/route";

beforeEach(() => {
  resetMetricsForTests();
  vi.unstubAllEnvs();
});

describe("request correlation", () => {
  it("preserves a valid request ID and replaces invalid input", () => {
    expect(
      getOrCreateRequestId(new Headers({ "x-request-id": "edge:abc-123" })),
    ).toBe("edge:abc-123");
    expect(
      getOrCreateRequestId(new Headers({ "x-request-id": "bad value\n" })),
    ).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("normalizes resource IDs before using paths as metric labels", () => {
    expect(
      normalizeApiRoute(
        "/api/v1/projects/project-secret/files/file-secret",
      ),
    ).toBe("/api/v1/projects/:projectId/files/:fileId");
  });

  it("returns the correlation ID to clients", () => {
    const request = new NextRequest("http://localhost/api/projects", {
      headers: { "x-request-id": "request-123" },
    });
    const response = NextResponse.json({ ok: true });
    completeRequest(request, response, Date.now(), "ui");
    expect(response.headers.get("x-request-id")).toBe("request-123");
  });
});

describe("prometheus metrics", () => {
  it("exports HTTP and dependency counts without resource IDs", () => {
    observeHttpRequest({
      method: "GET",
      route: "/api/projects/:projectId",
      statusCode: 503,
      durationMs: 42,
    });
    observeDependency({
      dependency: "storage",
      operation: "R2.download",
      durationMs: 12,
      success: false,
    });
    const output = renderMetrics();
    expect(output).toContain("leemage_http_requests_total");
    expect(output).toContain('route="/api/projects/:projectId"');
    expect(output).toContain("leemage_dependency_errors_total");
  });

  it("keeps the metrics endpoint hidden unless its token matches", async () => {
    vi.stubEnv("METRICS_TOKEN", "metrics-secret");
    const denied = getMetrics(
      new NextRequest("http://localhost/api/metrics", {
        headers: { authorization: "Bearer wrong" },
      }),
    );
    expect(denied.status).toBe(404);

    const allowed = getMetrics(
      new NextRequest("http://localhost/api/metrics", {
        headers: { authorization: "Bearer metrics-secret" },
      }),
    );
    expect(allowed.status).toBe(200);
    expect(await allowed.text()).toContain("leemage_http_requests_total");
  });
});
