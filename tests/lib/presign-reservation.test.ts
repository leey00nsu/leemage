import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  project: vi.fn(),
  deleteMany: vi.fn(),
  reserve: vi.fn(),
  adapter: vi.fn(),
  presign: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: mocks.project },
    file: { deleteMany: mocks.deleteMany },
  },
}));
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: vi.fn(async () => ({ authorized: true })),
}));
vi.mock("@/lib/api/storage-quota", () => ({
  reservePendingUpload: mocks.reserve,
}));
vi.mock("@/lib/storage", () => ({
  StorageFactory: { getAdapter: mocks.adapter },
}));

import { presignHandler } from "@/lib/api/presign";

const request = () =>
  new NextRequest("http://localhost/api/projects/project/files/presign", {
    method: "POST",
    body: JSON.stringify({
      fileName: "asset.pdf",
      contentType: "application/pdf",
      fileSize: 100,
    }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.project.mockResolvedValue({
    storageProvider: "R2",
    maxUploadBytes: 1024,
  });
  mocks.reserve.mockResolvedValue({ allowed: true });
  mocks.adapter.mockResolvedValue({
    createPresignedUploadUrl: mocks.presign,
    getObjectUrl: (name: string) => `https://storage.test/${name}`,
  });
  mocks.presign.mockResolvedValue({
    presignedUrl: "https://storage.test/upload",
    objectUrl: "https://storage.test/object",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
  });
});

it("reserves quota before issuing an upload URL", async () => {
  const response = await presignHandler(request(), "project", "owner");

  expect(response.status).toBe(200);
  expect(mocks.reserve).toHaveBeenCalledWith(
    "R2",
    expect.objectContaining({
      projectId: "project",
      size: 100,
      status: "PENDING",
      objectName: expect.not.stringContaining(".upload-"),
      uploadObjectName: expect.stringContaining(".upload-"),
    }),
  );
  expect(mocks.presign).toHaveBeenCalledWith(
    expect.objectContaining({
      objectName: expect.stringContaining(".upload-"),
      contentLength: 100,
    }),
  );
  expect(mocks.reserve.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.presign.mock.invocationCallOrder[0],
  );
});

it("does not issue an upload URL when reservation exceeds quota", async () => {
  mocks.reserve.mockResolvedValue({
    allowed: false,
    message: "Storage quota exceeded.",
    remaining: 50,
    currentUsage: 950,
    quota: 1000,
  });

  const response = await presignHandler(request(), "project", "owner");

  expect(response.status).toBe(413);
  expect(await response.json()).toMatchObject({
    code: "QUOTA_EXCEEDED",
    remaining: 50,
  });
  expect(mocks.presign).not.toHaveBeenCalled();
});

it("releases the pending reservation if URL signing fails", async () => {
  mocks.presign.mockRejectedValue(new Error("storage unavailable"));

  const response = await presignHandler(request(), "project", "owner");

  expect(response.status).toBe(500);
  expect(mocks.deleteMany).toHaveBeenCalledWith({
    where: { id: expect.any(String), status: "PENDING" },
  });
});

it("uses a size-limited application upload capability for OCI", async () => {
  mocks.project.mockResolvedValue({
    storageProvider: "OCI",
    maxUploadBytes: 1024,
  });

  const response = await presignHandler(request(), "project", "owner");
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body.presignedUrl).toMatch(
    /^http:\/\/localhost\/api\/uploads\/.+\?token=.+$/,
  );
  expect(mocks.presign).not.toHaveBeenCalled();
  expect(mocks.reserve).toHaveBeenCalledWith(
    "OCI",
    expect.objectContaining({
      uploadTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      uploadExpiresAt: expect.any(Date),
    }),
  );
});
