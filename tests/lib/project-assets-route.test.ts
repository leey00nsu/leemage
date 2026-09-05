import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  ownership: vi.fn(),
  project: vi.fn(),
  files: vi.fn(),
  count: vi.fn(),
  totals: vi.fn(),
}));
vi.mock("@/lib/auth/session-auth", () => ({
  withSessionAuth: (handler: unknown) => handler,
}));
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: mocks.ownership,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUniqueOrThrow: mocks.project },
    file: { findMany: mocks.files, count: mocks.count },
    $queryRaw: mocks.totals,
  },
}));
import { GET } from "@/app/api/projects/[projectId]/assets/route";
const request = (query: string) =>
  Object.assign(
    new NextRequest(`http://localhost/api/projects/p/assets?${query}`),
    { session: { username: "owner" } },
  );
beforeEach(() => {
  vi.resetAllMocks();
  mocks.ownership.mockResolvedValue({ authorized: true });
  mocks.project.mockResolvedValue({ id: "p", storageProvider: "R2" });
  mocks.files.mockImplementation(async (args) =>
    args.distinct
      ? [{ mimeType: "audio/mpeg" }, { mimeType: "image/png" }]
      : [{ id: "page-file" }],
  );
  mocks.count.mockResolvedValue(80);
  mocks.totals.mockResolvedValue([
    { count: BigInt(100), bytes: BigInt(12000) },
  ]);
});
it("pages in the database with stable ordering and project-wide totals", async () => {
  const result = await GET(
    request("page=2&type=AUDIO&search=한글&sort=SIZE_DESC"),
    { params: Promise.resolve({ projectId: "p" }) },
  );
  expect(mocks.files).toHaveBeenLastCalledWith(
    expect.objectContaining({
      skip: 30,
      take: 30,
      where: {
        projectId: "p",
        status: "COMPLETED",
        mimeType: { in: ["audio/mpeg"] },
        name: { contains: "한글", mode: "insensitive" },
      },
      orderBy: [{ size: "desc" }, { id: "asc" }],
    }),
  );
  expect(await result.json()).toMatchObject({
    page: 2,
    pageCount: 3,
    total: 80,
    fileCount: 100,
    totalBytes: 12000,
    formats: ["audio/mpeg", "image/png"],
  });
});
it("clamps a stale last page after deletion", async () => {
  mocks.count.mockResolvedValue(2);
  const response = await GET(request("page=3"), {
    params: Promise.resolve({ projectId: "p" }),
  });
  expect(await response.json()).toMatchObject({ page: 1, pageCount: 1 });
  expect(mocks.files).toHaveBeenLastCalledWith(
    expect.objectContaining({ skip: 0, take: 30 }),
  );
});
it("does not read another user's files", async () => {
  mocks.ownership.mockResolvedValue({ authorized: false });
  const response = await GET(request(""), {
    params: Promise.resolve({ projectId: "p" }),
  });
  expect(response.status).toBe(404);
  expect(mocks.files).not.toHaveBeenCalled();
});

it.each([30, 50, 100])(
  "honors page size %s in the database",
  async (pageSize) => {
    mocks.count.mockResolvedValue(240);
    const response = await GET(request(`page=2&pageSize=${pageSize}`), {
      params: Promise.resolve({ projectId: "p" }),
    });
    expect(mocks.files).toHaveBeenLastCalledWith(
      expect.objectContaining({ skip: pageSize, take: pageSize }),
    );
    expect(await response.json()).toMatchObject({
      pageSize,
      pageCount: Math.ceil(240 / pageSize),
    });
  },
);
it.each(["0", "-1", "36", "1000000", "abc"])(
  "falls back to 30 for invalid page size %s",
  async (pageSize) => {
    const response = await GET(request(`pageSize=${pageSize}`), {
      params: Promise.resolve({ projectId: "p" }),
    });
    expect(await response.json()).toMatchObject({ pageSize: 30 });
  },
);
