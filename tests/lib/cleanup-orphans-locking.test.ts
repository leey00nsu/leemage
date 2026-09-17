import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const tx = {
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
    file: { deleteMany: mocks.deleteMany },
  };

  return {
    prisma: {
      $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
    },
  };
});

import { cleanupOrphanFiles } from "@/lib/api/cleanup-orphans";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.queryRaw
    .mockResolvedValueOnce([{ locked: true }])
    .mockResolvedValueOnce([{ id: "pending-file" }]);
  mocks.executeRaw.mockResolvedValue(1);
  mocks.deleteMany.mockResolvedValue({ count: 1 });
});

it("locks pending cleanup candidates before enqueueing their objects", async () => {
  await expect(cleanupOrphanFiles()).resolves.toEqual({
    deletedCount: 1,
    errors: [],
  });

  const candidateQuery = mocks.queryRaw.mock.calls[1]?.[0];
  expect(candidateQuery.strings.join(" ")).toContain("FOR UPDATE SKIP LOCKED");
  expect(mocks.executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.deleteMany.mock.invocationCallOrder[0],
  );
  expect(mocks.executeRaw.mock.calls[0]?.[0].strings.join(" ")).toContain(
    '"File"."uploadObjectName"',
  );
  expect(mocks.deleteMany).toHaveBeenCalledWith({
    where: {
      id: { in: ["pending-file"] },
      status: "PENDING",
      createdAt: { lt: expect.any(Date) },
    },
  });
});
