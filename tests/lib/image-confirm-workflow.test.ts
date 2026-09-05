import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({
  update: vi.fn(),
  download: vi.fn(),
  upload: vi.fn(),
  adapter: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: { findUnique: vi.fn(async () => ({ storageProvider: "R2" })) },
    file: {
      findFirst: vi.fn(async () => ({ id: "f" })),
      update: mocks.update,
      delete: vi.fn(),
    },
  },
}));
vi.mock("@/lib/auth/ownership", () => ({
  verifyProjectOwnership: vi.fn(async () => ({ authorized: true })),
}));
vi.mock("@/lib/storage", () => ({
  StorageFactory: { getAdapter: mocks.adapter },
}));
import { confirmHandler } from "@/lib/api/confirm";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.adapter.mockResolvedValue({
    getObjectUrl: () => "https://example.com/source.png",
    downloadObject: mocks.download,
    uploadObject: mocks.upload,
  });
  mocks.upload.mockResolvedValue("https://example.com/thumbnail.webp");
  mocks.update.mockImplementation(async ({ data }) => ({ id: "f", ...data }));
});
it("confirms a Korean-named image without transform options as an image with a bounded WebP preview", async () => {
  const original = await sharp({
    create: { width: 800, height: 600, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  mocks.download.mockResolvedValue(original);
  const request = new NextRequest("http://localhost/api/confirm", {
    method: "POST",
    body: JSON.stringify({
      fileId: "f",
      objectName: "p/f.png",
      fileName: "한글 이미지.png",
      contentType: "image/png",
      fileSize: original.length,
    }),
  });
  const response = await confirmHandler(request, "p", "owner");
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.file.isImage).toBe(true);
  expect(body.file.name).toBe("한글 이미지.png");
  expect(body.variants).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        label: "thumbnail",
        format: "webp",
        width: 480,
        height: 360,
      }),
    ]),
  );
  const metadata = await sharp(mocks.upload.mock.calls[0][1]).metadata();
  expect(metadata.format).toBe("webp");
  expect(metadata.width).toBe(480);
});
