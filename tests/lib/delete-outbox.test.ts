import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  fileFind: vi.fn(),
  queryRaw: vi.fn(),
  fileDelete: vi.fn(),
  projectFind: vi.fn(),
  projectDelete: vi.fn(),
  executeRaw: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/api/storage-quota", () => ({
  invalidateAllStorageCaches: mocks.invalidate,
}));

import { deleteFileHandler, deleteFilesHandler, deleteFilesRequestHandler } from "@/lib/api/file-delete";
import { deleteProjectHandler } from "@/lib/api/project-details";

const tx = {
  file: { findFirst: mocks.fileFind, deleteMany: mocks.fileDelete },
  project: {
    findFirst: mocks.projectFind,
    deleteMany: mocks.projectDelete,
  },
  $executeRaw: mocks.executeRaw,
  $queryRaw: mocks.queryRaw,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((callback) => callback(tx));
  mocks.fileFind.mockResolvedValue({ id: "file-1" });
  mocks.queryRaw.mockResolvedValue([{ id: "file-1" }]);
  mocks.fileDelete.mockResolvedValue({ count: 1 });
  mocks.projectFind.mockResolvedValue({ id: "project-1" });
  mocks.projectDelete.mockResolvedValue({ count: 1 });
  mocks.executeRaw.mockResolvedValue(2);
});

describe("delete outbox", () => {
  it("queues object cleanup in the file deletion transaction", async () => {
    const response = await deleteFileHandler("file-1", "project-1", "owner");

    expect(response.status).toBe(200);
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
    expect(mocks.fileDelete).toHaveBeenCalledAfter(mocks.executeRaw);
  });

  it("queues all project objects before cascading database deletion", async () => {
    const response = await deleteProjectHandler("project-1", "owner");

    expect(response.status).toBe(200);
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
    expect(mocks.projectDelete).toHaveBeenCalledAfter(mocks.executeRaw);
  });

  it("does not enqueue anything for a resource owned by someone else", async () => {
    mocks.queryRaw.mockResolvedValue([]);
    const response = await deleteFileHandler("file-1", "project-1", "other");

    expect(response.status).toBe(404);
    expect(mocks.executeRaw).not.toHaveBeenCalled();
  });

  it("deletes 100 files with one transaction, one outbox insert and one delete", async () => {
    const fileIds = Array.from({ length: 100 }, (_, i) => `file-${i}`);
    mocks.queryRaw.mockResolvedValue(fileIds.map((id) => ({ id })));
    mocks.fileDelete.mockResolvedValue({ count: 100 });
    const response = await deleteFilesHandler(fileIds, "project-1", "owner");
    expect(response.status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    expect(mocks.queryRaw.mock.calls[0][0].strings.join(" ")).toContain("FOR UPDATE OF f");
    expect(mocks.queryRaw.mock.calls[0][0].values).toContain("owner");
    expect(mocks.queryRaw.mock.calls[0][0].values).toContain("project-1");
    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
    expect(mocks.fileDelete).toHaveBeenCalledExactlyOnceWith({
      where: { id: { in: fileIds }, projectId: "project-1" },
    });
    expect(mocks.invalidate).toHaveBeenCalledTimes(1);
  });

  it("rejects the whole batch if an ID is missing or belongs to another project", async () => {
    const response = await deleteFilesHandler(["file-1", "foreign-file"], "project-1", "owner");
    expect(response.status).toBe(404);
    expect(mocks.executeRaw).not.toHaveBeenCalled();
    expect(mocks.fileDelete).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("deduplicates IDs before checking and deleting", async () => {
    const response = await deleteFilesHandler(["file-1", "file-1"], "project-1", "owner");
    expect(response.status).toBe(200);
    expect(mocks.fileDelete).toHaveBeenCalledWith({
      where: { id: { in: ["file-1"] }, projectId: "project-1" },
    });
  });

  it.each([{ ids: [] }, { ids: [""] }, { ids: Array(101).fill("file-1") }])("rejects invalid batches before opening a transaction", async ({ ids }) => {
    const response = await deleteFilesHandler(ids, "project-1", "owner");
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("does not delete rows when queuing cleanup fails", async () => {
    mocks.executeRaw.mockRejectedValue(new Error("outbox failed"));
    const response = await deleteFilesHandler(["file-1"], "project-1", "owner");
    expect(response.status).toBe(500);
    expect(mocks.fileDelete).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("throws inside the transaction if deletion counts do not match", async () => {
    mocks.fileDelete.mockResolvedValue({ count: 0 });
    const response = await deleteFilesHandler(["file-1"], "project-1", "owner");
    expect(response.status).toBe(500);
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON", async () => {
    const response = await deleteFilesRequestHandler(
      new Request("http://localhost/bulk-delete", { method: "POST", body: "{" }),
      "project-1", "owner",
    );
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
