import { createHash } from "node:crypto";
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFile: vi.fn(),
  getAdapter: vi.fn(),
  uploadStream: vi.fn(),
  metadata: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { file: { findUnique: mocks.findFile } },
}));
vi.mock("@/lib/storage", () => ({
  StorageFactory: { getAdapter: mocks.getAdapter },
}));
vi.mock("@/lib/storage/utils", () => ({
  fromPrismaStorageProvider: (provider: string) => provider,
}));

import { uploadObjectHandler } from "@/lib/api/upload-object";
import { promoteUpload } from "@/lib/api/confirm/promote-upload";

const token = "upload-capability";
const tokenHash = createHash("sha256").update(token).digest("hex");

function uploadRequest(body: string, contentLength = body.length) {
  return new NextRequest(
    `http://localhost/api/uploads/file?token=${token}`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/pdf",
        "content-length": String(contentLength),
      },
      body,
    },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findFile.mockResolvedValue({
    status: "PENDING",
    size: 4,
    mimeType: "application/pdf",
    uploadObjectName: "project/file.upload-token",
    uploadTokenHash: tokenHash,
    uploadExpiresAt: new Date(Date.now() + 60_000),
    project: { storageProvider: "OCI" },
  });
  mocks.uploadStream.mockImplementation(async (_name, stream) => {
    for await (const chunk of stream) {
      // Consume the bounded stream just as the provider SDK does.
      void chunk;
    }
  });
  mocks.metadata.mockResolvedValue({ size: 4, revision: "etag" });
  mocks.getAdapter.mockResolvedValue({
    uploadObjectStream: mocks.uploadStream,
    getObjectMetadata: mocks.metadata,
  });
});

it("streams only the exact reserved bytes through a valid capability", async () => {
  const response = await uploadObjectHandler(uploadRequest("data"), "file");

  expect(response.status).toBe(204);
  expect(mocks.uploadStream).toHaveBeenCalledWith(
    "project/file.upload-token",
    expect.anything(),
    "application/pdf",
    4,
  );
});

it("rejects forged lengths and invalid capabilities before storage", async () => {
  expect(
    (await uploadObjectHandler(uploadRequest("data", 3), "file")).status,
  ).toBe(413);

  const invalid = new NextRequest(
    "http://localhost/api/uploads/file?token=wrong",
    {
      method: "PUT",
      headers: {
        "content-type": "application/pdf",
        "content-length": "4",
      },
      body: "data",
    },
  );
  expect((await uploadObjectHandler(invalid, "file")).status).toBe(404);
  expect(mocks.uploadStream).not.toHaveBeenCalled();
});

it("treats a concurrently promoted, size-matched destination as success", async () => {
  const adapter = {
    promoteObject: vi.fn().mockRejectedValue(new Error("destination exists")),
    getObjectMetadata: vi.fn().mockResolvedValue({ size: 4, revision: "etag" }),
  };

  await expect(
    promoteUpload({
      storageAdapter: adapter as never,
      uploadObjectName: "project/temp",
      finalObjectName: "project/final",
      expectedSize: 4,
      sourceRevision: "source-etag",
    }),
  ).resolves.toBeUndefined();
});
