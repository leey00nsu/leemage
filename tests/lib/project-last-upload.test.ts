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
    {
      ...base,
      id: "p",
      files: [
        {
          id: "image",
          name: "photo.png",
          mimeType: "image/png",
          variants: [
            {
              label: "thumbnail",
              format: "webp",
              url: "https://assets.test/thumb.webp",
            },
          ],
          uploadedAt: uploaded,
          updatedAt: new Date("2026-09-08T00:00:00Z"),
        },
        {
          id: "audio",
          name: "song.mp3",
          mimeType: "audio/mpeg",
          variants: [],
          uploadedAt: createdAt,
          updatedAt: createdAt,
        },
      ],
    },
    { ...base, id: "empty", files: [], _count: { files: 0 } },
  ]);
  const response = await getProjectsHandler("owner");
  const body = await response.json();
  expect(body).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "p",
        lastUploadedAt: uploaded.toISOString(),
        recentFiles: [
          {
            id: "image",
            name: "photo.png",
            mimeType: "image/png",
            thumbnailUrl: "https://assets.test/thumb.webp",
          },
          {
            id: "audio",
            name: "song.mp3",
            mimeType: "audio/mpeg",
            thumbnailUrl: null,
          },
        ],
      }),
      expect.objectContaining({
        id: "empty",
        lastUploadedAt: null,
        fileCount: 0,
        recentFiles: [],
      }),
    ]),
  );
  expect(findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      select: expect.objectContaining({
        files: {
          where: { status: "COMPLETED" },
          orderBy: [
            { uploadedAt: { sort: "desc", nulls: "last" } },
            { createdAt: "desc" },
            { id: "desc" },
          ],
          take: 3,
          select: {
            id: true,
            name: true,
            mimeType: true,
            variants: true,
            uploadedAt: true,
            updatedAt: true,
          },
        },
        _count: { select: { files: { where: { status: "COMPLETED" } } } },
      }),
    }),
  );
});
