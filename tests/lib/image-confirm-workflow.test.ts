import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
import { NextRequest } from "next/server";
import type { ImageJob } from "@/lib/generated/prisma";

const mocks = vi.hoisted(() => ({
  pending: vi.fn(),
  project: vi.fn(),
  findFile: vi.fn(),
  updateFile: vi.fn(),
  updateFiles: vi.fn(),
  createJob: vi.fn(),
  findJob: vi.fn(),
  updateJobs: vi.fn(),
  quota: vi.fn(),
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  head: vi.fn(),
  download: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  adapter: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  const db = {
    file: {
      findFirst: mocks.pending,
      findUnique: mocks.findFile,
      update: mocks.updateFile,
      updateMany: mocks.updateFiles,
    },
    project: { findUnique: mocks.project },
    imageJob: {
      create: mocks.createJob,
      findFirst: mocks.findJob,
      updateMany: mocks.updateJobs,
    },
    storageQuota: { findUnique: mocks.quota },
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
  };
  return {
    prisma: {
      ...db,
      $transaction: async (operation: (tx: typeof db) => unknown) =>
        operation(db),
    },
  };
});
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: vi.fn(async () => ({ authorized: true })),
}));
vi.mock("@/lib/storage", () => ({
  fromPrismaStorageProvider: (value: string) => value,
  StorageFactory: { getAdapter: mocks.adapter },
}));

import { confirmHandler } from "@/lib/api/confirm";
import { executeImageJob } from "@/lib/image/queue";

const pendingFile = {
  id: "f",
  projectId: "p",
  objectName: "p/f.png",
  name: "한글 이미지.png",
  mimeType: "image/png",
  size: 100,
  isImage: true,
  status: "PENDING",
  processingStatus: "NONE",
  variants: [],
  url: null,
};
const queuedFile = {
  ...pendingFile,
  status: "COMPLETED",
  processingStatus: "QUEUED",
  url: "https://assets.test/p/f.png",
};
const job = {
  id: "f",
  variants: [],
  leaseToken: "lease",
  attempts: 1,
  status: "RUNNING",
} as unknown as ImageJob;

const confirm = (variants: unknown[] = []) =>
  confirmHandler(
    new NextRequest("http://localhost/api/confirm", {
      method: "POST",
      body: JSON.stringify({
        fileId: "f",
        objectName: "p/f.png",
        fileName: "한글 이미지.png",
        contentType: "image/png",
        fileSize: 100,
        variants,
      }),
    }),
    "p",
    "owner",
  );

beforeEach(() => {
  vi.clearAllMocks();
  mocks.pending.mockResolvedValue(pendingFile);
  mocks.project.mockResolvedValue({
    storageProvider: "R2",
    maxUploadBytes: 50 * 1024 * 1024,
    videoThumbnailEnabled: true,
  });
  mocks.findFile.mockResolvedValue(queuedFile);
  mocks.updateFiles.mockResolvedValue({ count: 1 });
  mocks.updateJobs.mockResolvedValue({ count: 1 });
  mocks.findJob.mockResolvedValue(job);
  mocks.quota.mockResolvedValue(null);
  mocks.queryRaw.mockResolvedValue([{ bytes: BigInt(100) }]);
  mocks.executeRaw.mockResolvedValue(1);
  mocks.head.mockResolvedValue(100);
  mocks.remove.mockResolvedValue(undefined);
  mocks.adapter.mockResolvedValue({
    getObjectSize: mocks.head,
    getObjectUrl: () => "https://assets.test/p/f.png",
    downloadObject: mocks.download,
    uploadObject: mocks.upload,
    deleteObject: mocks.remove,
  });
  mocks.upload.mockImplementation(
    async (name: string) => `https://assets.test/${name}`,
  );
});

it("atomically queues image work without downloading in the request", async () => {
  const response = await confirm([
    { sizeLabel: "max800", format: "webp" },
  ]);

  expect(response.status).toBe(202);
  expect(mocks.download).not.toHaveBeenCalled();
  expect(mocks.createJob).toHaveBeenCalledWith({
    data: {
      id: "f",
      variants: [{ sizeLabel: "max800", format: "webp" }],
    },
  });
  expect(mocks.updateFiles).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        id: "f",
        status: "PENDING",
        processingStatus: "NONE",
      }),
      data: expect.objectContaining({
        status: "COMPLETED",
        processingStatus: "QUEUED",
      }),
    }),
  );
});

it("returns an idempotent accepted response for a duplicate confirm", async () => {
  mocks.pending.mockResolvedValue(queuedFile);

  const response = await confirm();

  expect(response.status).toBe(202);
  expect(mocks.head).not.toHaveBeenCalled();
  expect(mocks.createJob).not.toHaveBeenCalled();
});

it("processes bounded variants sequentially in the worker", async () => {
  const original = await sharp({
    create: { width: 1600, height: 1200, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  mocks.download.mockResolvedValue(original);
  mocks.findFile.mockResolvedValue({
    ...queuedFile,
    size: original.length,
    project: { storageProvider: "R2" },
  });

  await executeImageJob({
    ...job,
    variants: [
      { sizeLabel: "800x200", format: "webp", fit: "inside" },
      { sizeLabel: "800x200", format: "webp", fit: "cover" },
    ],
  } as unknown as ImageJob);

  expect(mocks.upload).toHaveBeenCalledTimes(3);
  const published = mocks.updateFile.mock.calls.find(
    ([call]) => call.data?.processingStatus === "READY",
  )?.[0];
  expect(published.data.variants).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ label: "thumbnail", width: 480, height: 360 }),
      expect.objectContaining({ width: 267, height: 200 }),
      expect.objectContaining({ width: 800, height: 200 }),
    ]),
  );
  for (const [, buffer] of mocks.upload.mock.calls) {
    const metadata = await sharp(buffer).metadata();
    expect(metadata.width).toBeGreaterThan(0);
    expect(metadata.height).toBeGreaterThan(0);
  }
});

it("rejects invalid image content and removes the source", async () => {
  mocks.download.mockResolvedValue(Buffer.from("not an image"));
  mocks.findFile.mockResolvedValue({
    ...queuedFile,
    project: { storageProvider: "R2" },
  });

  await executeImageJob(job);

  expect(mocks.updateFiles).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "FAILED",
        processingStatus: "FAILED",
      }),
    }),
  );
  expect(mocks.remove).toHaveBeenCalledWith("p/f.png");
  expect(mocks.upload).not.toHaveBeenCalled();
});

it("drops generated variants when their actual bytes exceed quota", async () => {
  const original = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  mocks.download.mockResolvedValue(original);
  mocks.findFile.mockResolvedValue({
    ...queuedFile,
    size: original.length,
    project: { storageProvider: "R2" },
  });
  mocks.quota.mockResolvedValue({ quotaBytes: BigInt(original.length) });
  mocks.queryRaw.mockResolvedValue([{ bytes: BigInt(original.length) }]);

  await executeImageJob(job);

  expect(mocks.updateFile).toHaveBeenCalledWith({
    where: { id: "f" },
    data: { processingStatus: "FAILED" },
  });
  expect(mocks.remove).toHaveBeenCalledWith(
    expect.stringContaining("-thumbnail-lease.webp"),
  );
});
