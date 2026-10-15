import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteObjects: vi.fn(),
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
  claimObjectCleanupJobs,
  enqueueStorageObjects,
  executeObjectCleanupJob,
  executeObjectCleanupJobs,
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
  mocks.getAdapter.mockResolvedValue({ deleteObjects: mocks.deleteObjects });
  mocks.deleteObjects.mockImplementation(async (names: string[]) => ({ deleted: names, failed: [] }));
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

    expect(mocks.deleteObjects).toHaveBeenCalledWith([job.objectName]);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ leaseToken: "lease-1" }),
    });
  });

  it("requeues transient failures using the lease fence", async () => {
    mocks.deleteObjects.mockRejectedValue(new Error("timeout"));
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

  it("claims up to 1000 due jobs with row locks and one shared lease", async () => {
    mocks.queryRaw.mockResolvedValue([job]);
    await expect(claimObjectCleanupJobs()).resolves.toEqual([job]);
    const sql = mocks.queryRaw.mock.calls[0][0].join(" ");
    expect(sql).toContain("FOR UPDATE SKIP LOCKED LIMIT");
    expect(sql).toContain('"availableAt" <= NOW()');
    expect(mocks.queryRaw.mock.calls[0]).toContain(1000);
  });

  it("batches storage deletion and acknowledgements for 1000 jobs", async () => {
    const jobs = Array.from({ length: 1000 }, (_, i) => ({ ...job, objectName: `p/${i}` }));
    await executeObjectCleanupJobs(jobs);
    expect(mocks.deleteObjects).toHaveBeenCalledTimes(1);
    expect(mocks.deleteObjects.mock.calls[0][0]).toHaveLength(1000);
    expect(mocks.deleteMany).toHaveBeenCalledExactlyOnceWith({ where: {
      provider: "R2", status: "RUNNING", leaseToken: "lease-1",
      objectName: { in: jobs.map((item) => item.objectName) },
    } });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it("acknowledges successes and retries only failed and unreported objects", async () => {
    const jobs = [job, { ...job, objectName: "failed" }, { ...job, objectName: "unknown" }];
    mocks.deleteObjects.mockResolvedValue({ deleted: [job.objectName], failed: ["failed"] });
    await executeObjectCleanupJobs(jobs);
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: expect.objectContaining({
      objectName: { in: [job.objectName] }, leaseToken: "lease-1",
    }) });
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ objectName: { in: ["failed", "unknown"] }, leaseToken: "lease-1" }),
      data: expect.objectContaining({ status: "QUEUED", leaseToken: null }),
    });
  });

  it("separates providers and preserves other providers when one fails", async () => {
    mocks.getAdapter.mockImplementation(async (provider: string) => ({
      deleteObjects: async (names: string[]) => {
        if (provider === "R2") throw new Error("provider down");
        return { deleted: names, failed: [] };
      },
    }));
    await executeObjectCleanupJobs([job, { ...job, provider: "OCI", objectName: "oci-object" }]);
    expect(mocks.deleteMany).toHaveBeenCalledWith({ where: expect.objectContaining({
      provider: "OCI", objectName: { in: ["oci-object"] },
    }) });
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ provider: "R2" }),
    }));
  });

  it("keeps retries separated by attempt count and lease token", async () => {
    mocks.deleteObjects.mockResolvedValue({ deleted: [], failed: [] });
    await executeObjectCleanupJobs([job, { ...job, objectName: "terminal", attempts: 5, leaseToken: "lease-2" }]);
    expect(mocks.updateMany).toHaveBeenCalledTimes(2);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ leaseToken: "lease-2", objectName: { in: ["terminal"] } }),
      data: expect.objectContaining({ status: "FAILED" }),
    });
  });

  it("ignores jobs without an active lease", async () => {
    await executeObjectCleanupJobs([{ ...job, leaseToken: null }, { ...job, status: "QUEUED" }]);
    expect(mocks.getAdapter).not.toHaveBeenCalled();
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });
});
