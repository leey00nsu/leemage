import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  ownership: vi.fn(),
  project: vi.fn(),
  count: vi.fn(),
  files: vi.fn(),
}));

vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: mocks.ownership,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: mocks.project },
    file: { count: mocks.count, findMany: mocks.files },
  },
}));

import { getProjectDetailsHandler } from "@/lib/api/project-details";

describe("project details pagination", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.ownership.mockResolvedValue({ authorized: true });
    mocks.project.mockResolvedValue({
      id: "project-1",
      name: "Project",
      description: null,
      storageProvider: "R2",
      maxUploadBytes: 100,
      videoThumbnailEnabled: true,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    });
    mocks.count.mockResolvedValue(60);
    mocks.files.mockResolvedValue([]);
  });

  it("bounds the response and uses a stable database order", async () => {
    const response = await getProjectDetailsHandler(
      "project-1",
      "owner",
      new URLSearchParams("page=3&pageSize=25"),
    );

    expect(mocks.files).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 50,
        take: 25,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
    expect(await response.json()).toMatchObject({
      total: 60,
      page: 3,
      pageCount: 3,
      pageSize: 25,
      files: [],
    });
  });

  it("clamps a stale page and rejects non-owner access", async () => {
    mocks.count.mockResolvedValue(2);
    const response = await getProjectDetailsHandler(
      "project-1",
      "owner",
      new URLSearchParams("page=999&pageSize=100"),
    );
    expect(await response.json()).toMatchObject({ page: 1, pageSize: 100 });

    mocks.ownership.mockResolvedValue({ authorized: false });
    const denied = await getProjectDetailsHandler("project-1", "other");
    expect(denied.status).toBe(404);
  });
});
