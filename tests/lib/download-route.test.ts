import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  adapter: vi.fn(),
  read: vi.fn(),
}));

vi.mock("@/lib/auth/session-auth", () => ({
  withSessionAuth: (handler: unknown) => handler,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { file: { findFirst: mocks.findFirst } },
}));
vi.mock("@/lib/storage", () => ({
  StorageFactory: { getAdapter: mocks.adapter },
}));

import { GET } from "@/app/api/projects/[projectId]/files/[fileId]/download/route";

const file = {
  id: "file",
  name: "photo.png",
  mimeType: "image/png",
  isImage: true,
  objectName: "project/file.png",
  status: "COMPLETED",
  variants: [
    {
      url: "https://cdn.example/project/file.png",
      width: 100,
      height: 100,
      size: 1,
      format: "png",
      label: "100x100",
    },
    {
      url: "https://cdn.example/project/file-thumbnail.webp",
      width: 50,
      height: 50,
      size: 1,
      format: "webp",
      label: "thumbnail",
    },
  ],
  project: { storageProvider: "R2" },
};

const request = (query = "") =>
  Object.assign(
    new NextRequest(
      `http://localhost/api/projects/project/files/file/download${query}`,
    ),
    { session: { username: "owner@example.com" } },
  );

const context = {
  params: Promise.resolve({ projectId: "project", fileId: "file" }),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.adapter.mockResolvedValue({ createReadAccess: mocks.read });
  mocks.read.mockResolvedValue({ url: "https://storage.example/signed" });
  mocks.findFirst.mockResolvedValue(file);
});

it("checks ownership and returns a short-lived storage redirect", async () => {
  const response = await GET(request(), context);

  expect(mocks.findFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        id: "file",
        projectId: "project",
        status: "COMPLETED",
        project: { userId: "owner@example.com" },
      },
    }),
  );
  expect(mocks.read).toHaveBeenCalledWith("project/file.png");
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "https://storage.example/signed",
  );
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

it("signs only a selected variant object inside the project", async () => {
  const response = await GET(request("?variant=thumbnail"), context);

  expect(response.status).toBe(307);
  expect(mocks.read).toHaveBeenCalledWith("project/file-thumbnail.webp");
});

it("does not expose missing or unauthorized files", async () => {
  mocks.findFirst.mockResolvedValue(null);

  const response = await GET(request(), context);

  expect(response.status).toBe(404);
  expect(mocks.read).not.toHaveBeenCalled();
});

it("rejects variant URLs that point outside the project namespace", async () => {
  mocks.findFirst.mockResolvedValue({
    ...file,
    variants: [
      file.variants[0],
      {
        ...file.variants[1],
        url: "https://attacker.example/another-project/secret.webp",
      },
    ],
  });

  const response = await GET(request("?variant=thumbnail"), context);

  expect(response.status).toBe(422);
  expect(mocks.read).not.toHaveBeenCalled();
});

it("never downloads and buffers the object in the application process", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch");

  await GET(request(), context);

  expect(fetchSpy).not.toHaveBeenCalled();
  fetchSpy.mockRestore();
});
