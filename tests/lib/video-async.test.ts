import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  project: vi.fn(),
  update: vi.fn(),
  createJob: vi.fn(),
  head: vi.fn(),
  download: vi.fn(),
  updateJob: vi.fn(),
  release: vi.fn(),
  remove: vi.fn(),
  upload: vi.fn(),
  process: vi.fn(),
}));
vi.mock("@/lib/prisma", () => {
  const db = {
    file: {
      findFirst: mocks.find,
      findUnique: mocks.find,
      findUniqueOrThrow: mocks.find,
      updateMany: mocks.update,
      update: mocks.update,
    },
    project: { findUnique: mocks.project },
    videoJob: { create: mocks.createJob, updateMany: mocks.updateJob },
  };
  return {
    prisma: {
      ...db,
      $transaction: async (fn: (tx: typeof db) => unknown) => fn(db),
    },
  };
});
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: async () => ({ authorized: true }),
}));
vi.mock("@/lib/api/storage-quota", () => ({
  invalidateAllStorageCaches: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({
  fromPrismaStorageProvider: (v: string) => v,
  StorageFactory: {
    getAdapter: async () => ({
      getObjectUrl: () => "https://assets.test/p/f.mp4",
      getObjectSize: mocks.head,
      downloadObject: mocks.download,
      createReadAccess: async () => ({
        url: "https://storage.test/private?secret=never-log",
        release: mocks.release,
      }),
      uploadObject: mocks.upload,
      deleteObject: mocks.remove,
    }),
  },
}));
vi.mock("@/lib/video/remote", () => ({ processRemoteVideo: mocks.process }));
import { confirmHandler } from "@/lib/api/confirm";
import { executeVideoJob } from "@/lib/video/queue";
import type { VideoJob } from "@/lib/generated/prisma";
import sharp from "sharp";
const MIB = 1024 * 1024;
const payload = {
  fileId: "f",
  objectName: "p/f.mp4",
  fileName: "한글 영상.mp4",
  contentType: "video/mp4",
  fileSize: 80 * MIB,
};
const job = { id: "f", leaseToken: "lease", attempts: 1 } as VideoJob;
const confirm = (body = payload) =>
  confirmHandler(
    new NextRequest("http://localhost/api/confirm", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    "p",
    "owner",
  );
beforeEach(() => {
  vi.resetAllMocks();
  mocks.project.mockResolvedValue({
    storageProvider: "R2",
    maxUploadBytes: 100 * MIB,
    videoThumbnailEnabled: true,
  });
  mocks.find.mockResolvedValue({
    id: "f",
    name: payload.fileName,
    mimeType: payload.contentType,
    size: payload.fileSize,
    objectName: payload.objectName,
    projectId: "p",
    status: "PENDING",
    processingStatus: "NONE",
    variants: [],
    url: "https://assets.test/p/f.mp4",
    project: { storageProvider: "R2", videoThumbnailEnabled: true },
  });
  mocks.head.mockResolvedValue(payload.fileSize);
  mocks.update.mockResolvedValue({ count: 1 });
  mocks.updateJob.mockResolvedValue({ count: 1 });
  mocks.release.mockResolvedValue(undefined);
  mocks.remove.mockResolvedValue(undefined);
  mocks.upload.mockResolvedValue("https://assets.test/p/thumbnail.jpg");
});
it("confirms an 80 MiB Korean-named video without downloading it and atomically enqueues processing", async () => {
  expect((await confirm()).status).toBe(201);
  expect(mocks.download).not.toHaveBeenCalled();
  expect(mocks.process).not.toHaveBeenCalled();
  expect(mocks.createJob).toHaveBeenCalledWith({ data: { id: "f" } });
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "COMPLETED",
        processingStatus: "QUEUED",
        uploadedAt: expect.any(Date),
      }),
    }),
  );
});
it("does not enqueue when project thumbnails are disabled", async () => {
  mocks.project.mockResolvedValue({
    storageProvider: "R2",
    maxUploadBytes: 100 * MIB,
    videoThumbnailEnabled: false,
  });
  expect((await confirm()).status).toBe(201);
  expect(mocks.createJob).not.toHaveBeenCalled();
});
it("rejects a forged object key before reading storage", async () => {
  expect(
    (await confirm({ ...payload, objectName: "other/private.mp4" })).status,
  ).toBe(400);
  expect(mocks.head).not.toHaveBeenCalled();
});
it("rejects actual oversized objects even when declared size is within limit", async () => {
  mocks.head.mockResolvedValue(101 * MIB);
  const response = await confirm();
  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({
    code: "FILE_SIZE_EXCEEDED",
    limitBytes: 100 * MIB,
  });
  expect(mocks.createJob).not.toHaveBeenCalled();
});
it("rejects declared size mismatch and duplicate confirmation", async () => {
  mocks.head.mockResolvedValue(payload.fileSize - 1);
  expect((await confirm()).status).toBe(400);
  mocks.find.mockResolvedValue(null);
  expect((await confirm()).status).toBe(400);
});
it("retries processing failures with backoff and releases private read access", async () => {
  mocks.process.mockRejectedValue(new Error("signed secret URL"));
  await executeVideoJob(job);
  expect(mocks.updateJob).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        status: "QUEUED",
        lastError: "VIDEO_PROCESSING_FAILED",
        availableAt: expect.any(Date),
      }),
    }),
  );
  expect(mocks.release).toHaveBeenCalledOnce();
});
it("marks the final failed attempt terminal", async () => {
  mocks.process.mockRejectedValue(new Error("failed"));
  await executeVideoJob({ ...job, attempts: 3 });
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({ data: { processingStatus: "FAILED" } }),
  );
});
it("cleans up output when a file is deleted or another worker owns its lease", async () => {
  const thumbnail = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  mocks.process.mockResolvedValue({ width: 1920, height: 1080, thumbnail });
  mocks.updateJob.mockResolvedValue({ count: 0 });
  await executeVideoJob(job);
  expect(mocks.remove).toHaveBeenCalledWith("p/f-thumbnail-lease.jpg");
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.release).toHaveBeenCalledOnce();
});
it("publishes only a small thumbnail and preserves original availability", async () => {
  const thumbnail = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "red" },
  })
    .jpeg()
    .toBuffer();
  mocks.process.mockResolvedValue({ width: 1920, height: 1080, thumbnail });
  await executeVideoJob(job);
  expect(mocks.download).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        processingStatus: "READY",
        variants: expect.arrayContaining([
          expect.objectContaining({
            label: "thumbnail",
            size: thumbnail.length,
          }),
        ]),
      }),
    }),
  );
  expect(mocks.remove).not.toHaveBeenCalled();
});
