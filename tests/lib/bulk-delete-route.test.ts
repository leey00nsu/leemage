import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const mocks = vi.hoisted(() => ({ key: vi.fn(), handler: vi.fn() }));
vi.mock("@/lib/auth/api-key-auth/validate-api-key", () => ({ validateApiKey: mocks.key }));
vi.mock("@/lib/api/file-delete", () => ({ deleteFilesRequestHandler: mocks.handler }));
vi.mock("@/lib/api/api-logger", () => ({
  logApiCall: vi.fn(), extractProjectIdFromPath: () => "project-1",
}));
import { POST } from "@/app/api/v1/projects/[projectId]/files/bulk-delete/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.key.mockResolvedValue({
    id: "test-bulk-delete-key", userIdentifier: "owner", name: "test", prefix: "test",
    permissions: ["delete"],
  });
  mocks.handler.mockResolvedValue(NextResponse.json({ message: "Deleted" }));
});
const request = () => new NextRequest("http://localhost/api/v1/projects/project-1/files/bulk-delete", {
  method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileIds: ["a", "b"] }),
});
const context = () => ({ params: Promise.resolve({ projectId: "project-1" }) });

it("requires delete permission even though the endpoint uses POST", async () => {
  mocks.key.mockResolvedValue({ id: "write-only", userIdentifier: "owner", permissions: ["write"] });
  expect((await POST(request(), context())).status).toBe(403);
  expect(mocks.handler).not.toHaveBeenCalled();
});

it("accepts a delete-only key and forwards the authenticated owner", async () => {
  const req = request();
  expect((await POST(req, context())).status).toBe(200);
  expect(mocks.handler).toHaveBeenCalledWith(req, "project-1", "owner");
});

it("rejects an unauthenticated request", async () => {
  mocks.key.mockResolvedValue(null);
  expect((await POST(request(), context())).status).toBe(401);
  expect(mocks.handler).not.toHaveBeenCalled();
});
