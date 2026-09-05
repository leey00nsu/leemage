import { expect, it, vi } from "vitest";
const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/lib/prisma", () => ({ prisma: { project: { findMany } } }));
import { getProjectsHandler } from "@/lib/api/projects";

it("uses completed-file confirmation dates, and returns null for empty projects", async () => {
  const createdAt = new Date("2026-01-01T00:00:00Z");
  const uploaded = new Date("2026-09-01T12:00:00Z");
  const base = {
    name: "Project",
    description: null,
    storageProvider: "R2",
    createdAt,
    updatedAt: createdAt,
    _count: { files: 1 },
  };
  findMany.mockResolvedValue([
    { ...base, id: "p", files: [{ updatedAt: uploaded }] },
    { ...base, id: "empty", files: [], _count: { files: 0 } },
  ]);
  const response = await getProjectsHandler("owner");
  const body = await response.json();
  expect(body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "p",
        lastUploadedAt: uploaded.toISOString(),
      }),
      expect.objectContaining({
        id: "empty",
        lastUploadedAt: null,
        fileCount: 0,
      }),
    ]),
  );
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      select: expect.objectContaining({
        files: {
          where: { status: "COMPLETED" },
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: { updatedAt: true },
        },
        _count: { select: { files: { where: { status: "COMPLETED" } } } },
      }),
    }),
  );
});
