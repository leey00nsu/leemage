import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteObject: vi.fn(),
  getAdapter: vi.fn(),
  deleteMany: vi.fn(),
  updateMany: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    objectCleanupJob: {
      deleteMany: mocks.deleteMany,
      updateMany: mocks.updateMany,
      upsert: mocks.upsert,
    },
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/storage/factory", () => ({
  StorageFactory: { getAdapter: mocks.getAdapter },
}));

import {
  claimObjectCleanupJob,
  enqueueStorageObjects,
  executeObjectCleanupJob,
} from "@/lib/storage/cleanup-queue";

const job = {
  provider: "R2" as const,
  objectName: "project/file.webp",
  status: "RUNNING",
  attempts: 1,
  availableAt: new Date(),
  leaseUntil: new Date(Date.now() + 60_000),
  leaseToken: "lease-1",
  lastError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getAdapter.mockResolvedValue({ deleteObject: mocks.deleteObject });
  mocks.deleteObject.mockResolvedValue(undefined);
  mocks.deleteMany.mockResolvedValue({ count: 1 });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation(async (operation) =>
    typeof operation === "function"
      ? operation({ objectCleanupJob: { upsert: mocks.upsert } })
      : Promise.all(operation),
  );
});

describe("object cleanup queue", () => {
  it("deletes the job only after object deletion succeeds", async () => {
    await executeObjectCleanupJob(job);

    expect(mocks.deleteObject).toHaveBeenCalledWith(job.objectName);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ leaseToken: "lease-1" }),
    });
  });

  it("requeues transient failures using the lease fence", async () => {
    mocks.deleteObject.mockRejectedValue(new Error("timeout"));
    await executeObjectCleanupJob(job);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ leaseToken: "lease-1" }),
      data: expect.objectContaining({ status: "QUEUED", leaseToken: null }),
    });
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("deduplicates objects before durable enqueue", async () => {
    mocks.upsert.mockResolvedValue({});
    await enqueueStorageObjects("OCI", ["p/a", "p/a", "p/b"]);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
  });

  it("marks exhausted expired leases before claiming work", async () => {
    mocks.queryRaw.mockResolvedValue([]);
    await expect(claimObjectCleanupJob()).resolves.toBeNull();
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED" }),
      }),
    );
  });
});
