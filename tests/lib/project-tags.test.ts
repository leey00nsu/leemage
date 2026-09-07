import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  ownership: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  fileCount: vi.fn(),
  tagCount: vi.fn(),
  updateFile: vi.fn(),
}));
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: mocks.ownership,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    projectTag: {
      create: mocks.create,
      findFirst: mocks.findFirst,
      update: mocks.updateTag,
      delete: mocks.deleteTag,
    },
    $transaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        file: { count: mocks.fileCount, update: mocks.updateFile },
        projectTag: { count: mocks.tagCount },
      }),
  },
}));
import { projectTagsHandler } from "@/lib/api/project-tags";
import { parseTagFilter, tagNameSchema } from "@/shared/lib/project-tags";
const req = (body: unknown) =>
  new Request("https://example.com", {
    method: "POST",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.ownership.mockResolvedValue({ authorized: true });
  mocks.fileCount.mockResolvedValue(2);
  mocks.tagCount.mockResolvedValue(1);
  mocks.create.mockImplementation(async ({ data }) => ({ id: "tag", ...data }));
});
it("rejects another owner's project before creating a tag", async () => {
  mocks.ownership.mockResolvedValue({ authorized: false });
  expect(
    (await projectTagsHandler(req({ name: "배너" }), "p", "other", "create"))
      .status,
  ).toBe(404);
  expect(mocks.create).not.toHaveBeenCalled();
});
it("normalizes Korean names and enforces case-insensitive uniqueness per project", async () => {
  const name = "배너".normalize("NFD");
  await projectTagsHandler(req({ name: ` ${name} ` }), "p", "owner", "create");
  expect(mocks.create).toHaveBeenCalledWith(
    expect.objectContaining({
      data: { projectId: "p", name: "배너", normalizedName: "배너" },
    }),
  );
  mocks.create.mockRejectedValue({ code: "P2002" });
  expect(
    (await projectTagsHandler(req({ name: "배너" }), "p", "owner", "create"))
      .status,
  ).toBe(409);
});
it("rejects empty, overlong, and control-character tag names", () => {
  for (const name of [" ", "a".repeat(41), "a\nb"])
    expect(tagNameSchema.safeParse({ name }).success).toBe(false);
});
it.each(["file", "tag"])(
  "rejects an entire batch containing a foreign-project %s",
  async (kind) => {
    if (kind === "file") mocks.fileCount.mockResolvedValue(1);
    else mocks.tagCount.mockResolvedValue(0);
    expect(
      (
        await projectTagsHandler(
          req({ fileIds: ["a", "foreign"], tagIds: ["tag"], operation: "add" }),
          "p",
          "owner",
          "apply",
        )
      ).status,
    ).toBe(404);
    expect(mocks.updateFile).not.toHaveBeenCalled();
  },
);
it.each(["add", "remove"])(
  "%s preserves unrelated tags and scopes each file mutation",
  async (operation) => {
    expect(
      (
        await projectTagsHandler(
          req({ fileIds: ["a", "b", "a"], tagIds: ["tag"], operation }),
          "p",
          "owner",
          "apply",
        )
      ).status,
    ).toBe(200);
    expect(mocks.updateFile).toHaveBeenCalledTimes(2);
    expect(mocks.updateFile).toHaveBeenCalledWith({
      where: { id: "a", projectId: "p", status: "COMPLETED" },
      data: {
        tags: {
          [operation === "add" ? "connect" : "disconnect"]: [
            { id: "tag", projectId: "p" },
          ],
        },
      },
    });
  },
);
it("does not rename a tag belonging to another project", async () => {
  mocks.findFirst.mockResolvedValue(null);
  expect(
    (
      await projectTagsHandler(
        req({ name: "new" }),
        "p",
        "owner",
        "rename",
        "foreign",
      )
    ).status,
  ).toBe(404);
  expect(mocks.updateTag).not.toHaveBeenCalled();
});
it("rejects oversized batches", async () => {
  expect(
    (
      await projectTagsHandler(
        req({
          fileIds: Array.from({ length: 101 }, (_, i) => String(i)),
          tagIds: ["tag"],
          operation: "add",
        }),
        "p",
        "owner",
        "apply",
      )
    ).status,
  ).toBe(400);
  expect(mocks.updateFile).not.toHaveBeenCalled();
});
it("builds any and all tag filters without matching untagged files", () => {
  expect(parseTagFilter(new URLSearchParams("tags=a,b&tagMode=all"))).toEqual({
    AND: [{ tags: { some: { id: "a" } } }, { tags: { some: { id: "b" } } }],
  });
  expect(parseTagFilter(new URLSearchParams("tags=a,b&tagMode=any"))).toEqual({
    tags: { some: { id: { in: ["a", "b"] } } },
  });
  expect(parseTagFilter(new URLSearchParams())).toEqual({});
  expect(() =>
    parseTagFilter(new URLSearchParams("tags=a&tagMode=invalid")),
  ).toThrow();
});
