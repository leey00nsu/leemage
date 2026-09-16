import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  fileFind: vi.fn(),
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

import { deleteFileHandler } from "@/lib/api/file-delete";
import { deleteProjectHandler } from "@/lib/api/project-details";

const tx = {
  file: { findFirst: mocks.fileFind, deleteMany: mocks.fileDelete },
  project: {
    findFirst: mocks.projectFind,
    deleteMany: mocks.projectDelete,
  },
  $executeRaw: mocks.executeRaw,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation((callback) => callback(tx));
  mocks.fileFind.mockResolvedValue({ id: "file-1" });
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
    mocks.fileFind.mockResolvedValue(null);
    const response = await deleteFileHandler("file-1", "project-1", "other");

    expect(response.status).toBe(404);
    expect(mocks.executeRaw).not.toHaveBeenCalled();
  });
});
