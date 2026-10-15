import { afterEach, expect, it, vi } from "vitest";
import { deleteFiles } from "@/features/files/delete/api/delete";

afterEach(() => vi.unstubAllGlobals());

it.each([1, 100])("sends %i selected IDs in a single bulk request", async (count) => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ message: "Deleted" }));
  vi.stubGlobal("fetch", fetchMock);
  const fileIds = Array.from({ length: count }, (_, i) => `file-${i}`);
  await deleteFiles({ projectId: "project-1", fileIds });
  expect(fetchMock).toHaveBeenCalledExactlyOnceWith("/api/projects/project-1/files/bulk-delete", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileIds }),
  });
});

it("surfaces a failed batch without falling back to individual requests", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ message: "Rate limit exceeded" }, { status: 429 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(deleteFiles({ projectId: "p", fileIds: ["a", "b"] })).rejects.toThrow("Rate limit exceeded");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
