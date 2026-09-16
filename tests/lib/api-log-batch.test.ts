import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createMany: vi.fn(),
  dropped: vi.fn(),
  warn: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { apiLog: { createMany: mocks.createMany } },
}));
vi.mock("@/lib/observability/metrics", () => ({
  recordDroppedApiLogs: mocks.dropped,
}));
vi.mock("@/lib/logging/secure-logger", () => ({
  apiLogger: { warn: mocks.warn },
}));

import { flushApiLogs, logApiCall } from "@/lib/api/api-logger";

beforeEach(async () => {
  await flushApiLogs();
  vi.clearAllMocks();
  vi.stubEnv("API_LOGGING_IN_TESTS", "true");
  mocks.createMany.mockResolvedValue({ count: 0 });
});

it("persists audit logs in a batch", async () => {
  await logApiCall({
    userId: "owner",
    endpoint: "/api/projects",
    method: "GET",
    statusCode: 200,
  });
  await logApiCall({
    userId: "owner",
    endpoint: "/api/projects",
    method: "POST",
    statusCode: 201,
  });
  await flushApiLogs();

  expect(mocks.createMany).toHaveBeenCalledWith({
    data: expect.arrayContaining([
      expect.objectContaining({ method: "GET" }),
      expect.objectContaining({ method: "POST" }),
    ]),
  });
});

it("drops a failed observability batch without failing requests", async () => {
  mocks.createMany.mockRejectedValue(new Error("database unavailable"));
  await logApiCall({
    userId: "owner",
    endpoint: "/api/projects",
    method: "GET",
    statusCode: 200,
  });
  await flushApiLogs();

  expect(mocks.dropped).toHaveBeenCalledWith(1);
  expect(mocks.warn).toHaveBeenCalledWith("api_log.batch_dropped", {
    count: 1,
  });
});
