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

async function confirmImage(variants: unknown[], width = 1600, height = 1200) {
  const original = await sharp({
    create: { width, height, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  mocks.download.mockResolvedValue(original);
  mocks.upload.mockImplementation(
    async (name) => `https://example.com/${name}`,
  );
  return confirmHandler(
    new NextRequest("http://localhost/api/confirm", {
      method: "POST",
      body: JSON.stringify({
        fileId: "f",
        objectName: "p/f.png",
        fileName: "사진.png",
        contentType: "image/png",
        fileSize: original.length,
        variants,
      }),
    }),
    "p",
    "owner",
  );
}
it("stores identical requests and the shared thumbnail once", async () => {
  const response = await confirmImage([
    { sizeLabel: "max480", format: "webp" },
    { sizeLabel: "480x480", format: "webp" },
    { sizeLabel: "thumbnail", format: "webp" },
    { sizeLabel: "source", format: "png" },
  ]);
  expect(response.status).toBe(201);
  const result = await response.json();
  expect(mocks.upload).toHaveBeenCalledTimes(1);
  expect(result.variants).toHaveLength(2);
  expect(result.file.thumbnail).toEqual(result.variants[1]);
});
it("honors height bounds and exact crops and matches actual encoded dimensions", async () => {
  const response = await confirmImage([
    { sizeLabel: "800x200", format: "webp", fit: "inside" },
    { sizeLabel: "800x200", format: "webp", fit: "cover" },
  ]);
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(
    body.variants.map((v: { width: number; height: number }) => [
      v.width,
      v.height,
    ]),
  ).toEqual([
    [1600, 1200],
    [480, 360],
    [267, 200],
    [800, 200],
  ]);
  for (let i = 0; i < mocks.upload.mock.calls.length; i++) {
    const metadata = await sharp(mocks.upload.mock.calls[i][1]).metadata();
    expect([metadata.width, metadata.height]).toEqual([
      body.variants[i + 1].width,
      body.variants[i + 1].height,
    ]);
  }
});
it("uses width rather than longest side for portrait max presets", async () => {
  const response = await confirmImage(
    [{ sizeLabel: "max800", format: "webp" }],
    1000,
    2000,
  );
  const body = await response.json();
  expect(body.file.thumbnail).toMatchObject({ width: 240, height: 480 });
  expect(body.variants[2]).toMatchObject({ width: 800, height: 1600 });
});
it("rejects oversized crops before writing transformed objects", async () => {
  const response = await confirmImage([
    { sizeLabel: "2000x2000", format: "webp", fit: "cover" },
  ]);
  expect(response.status).toBe(400);
  expect(mocks.upload).not.toHaveBeenCalled();
});
it("protects the public thumbnail format contract", async () => {
  const response = await confirmImage([
    { sizeLabel: "thumbnail", format: "png" },
  ]);
  expect(response.status).toBe(400);
  expect(mocks.upload).not.toHaveBeenCalled();
});
