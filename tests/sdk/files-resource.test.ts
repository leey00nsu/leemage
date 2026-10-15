import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilesResource } from "@/packages/sdk/src/resources/files";
import { NetworkError } from "@/packages/sdk/src/errors";
import type { FetchClient } from "@/packages/sdk/src/utils/fetch";
import type { UploadableFile } from "@/packages/sdk/src/types/api";

describe("FilesResource", () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    (globalThis as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("reads processing status and thumbnails from the file endpoint", async () => {
    const value = {
      id: "f",
      processingStatus: "READY",
      thumbnail: { url: "https://assets.test/thumb.jpg" },
    };
    const client = {
      get: vi.fn().mockResolvedValue(value),
    } as unknown as FetchClient;
    expect(await new FilesResource(client).get("p", "f")).toEqual(value);
    expect(client.get).toHaveBeenCalledWith("/api/v1/projects/p/files/f");
  });

  it("deletes a batch in one POST request", async () => {
    const client = { post: vi.fn().mockResolvedValue({ message: "Deleted" }) } as unknown as FetchClient;
    const fileIds = Array.from({ length: 100 }, (_, i) => `file-${i}`);
    await new FilesResource(client).deleteMany("project-1", fileIds);
    expect(client.post).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/projects/project-1/files/bulk-delete", { fileIds },
    );
  });

  it("uses the bulk endpoint for the existing single-file delete method", async () => {
    const response = { message: "Deleted" };
    const client = {
      post: vi.fn().mockResolvedValue(response),
      delete: vi.fn(),
    } as unknown as FetchClient;

    expect(await new FilesResource(client).delete("project/1", "file/1")).toEqual(response);
    expect(client.post).toHaveBeenCalledExactlyOnceWith(
      "/api/v1/projects/project%2F1/files/bulk-delete", { fileIds: ["file/1"] },
    );
    expect(client.delete).not.toHaveBeenCalled();
  });

  it("still rejects an empty file ID without sending a request", async () => {
    const client = { post: vi.fn() } as unknown as FetchClient;

    await expect(new FilesResource(client).delete("project-1", "")).rejects.toThrow("fileId는 필수입니다.");
    expect(client.post).not.toHaveBeenCalled();
  });

  it("uploads a file through presign -> upload -> confirm flow", async () => {
    const projectId = "project-123";
    const presignResult = {
      fileId: "file-1",
      objectName: "project-123/file-1",
      presignedUrl: "https://uploads.example.com/presigned",
    };
    const confirmResult = {
      file: { id: "file-1", name: "image.jpg" },
    };

    const client = {
      post: vi.fn().mockImplementation((path: string) => {
        if (path.endsWith("/presign")) {
          return Promise.resolve(presignResult);
        }
        if (path.endsWith("/confirm")) {
          return Promise.resolve(confirmResult);
        }
        return Promise.reject(new Error("unexpected path"));
      }),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
    } as unknown as FetchClient;

    const fileBuffer = new Uint8Array([1, 2, 3]).buffer;
    const file: UploadableFile = {
      name: "image.jpg",
      type: "image/jpeg",
      size: fileBuffer.byteLength,
      arrayBuffer: vi.fn().mockResolvedValue(fileBuffer),
    };

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
    });

    const onProgress = vi.fn();

    const resource = new FilesResource(client);
    const result = await resource.upload(projectId, file, {
      variants: [{ sizeLabel: "max800", format: "webp" }],
      onProgress,
    });

    expect(result).toEqual(confirmResult.file);

    expect(client.post).toHaveBeenNthCalledWith(
      1,
      `/api/v1/projects/${projectId}/files/presign`,
      {
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      presignResult.presignedUrl,
      expect.objectContaining({
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: fileBuffer,
      }),
    );

    expect(client.post).toHaveBeenNthCalledWith(
      2,
      `/api/v1/projects/${projectId}/files/confirm`,
      {
        fileId: presignResult.fileId,
        objectName: presignResult.objectName,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
        variants: [{ sizeLabel: "max800", format: "webp" }],
      },
    );

    expect(onProgress.mock.calls.map((call) => call[0])).toEqual([
      { stage: "presign" },
      { stage: "upload", percent: 0 },
      { stage: "upload", percent: 100 },
      { stage: "confirm" },
    ]);
  });

  it("throws NetworkError when upload fails", async () => {
    const projectId = "project-456";
    const presignResult = {
      fileId: "file-2",
      objectName: "project-456/file-2",
      presignedUrl: "https://uploads.example.com/presigned",
    };

    const client = {
      post: vi.fn().mockResolvedValue(presignResult),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
    } as unknown as FetchClient;

    const fileBuffer = new Uint8Array([4, 5]).buffer;
    const file: UploadableFile = {
      name: "fail.jpg",
      type: "image/jpeg",
      size: fileBuffer.byteLength,
      arrayBuffer: vi.fn().mockResolvedValue(fileBuffer),
    };

    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      statusText: "Forbidden",
    });

    const onProgress = vi.fn();
    const resource = new FilesResource(client);

    await expect(
      resource.upload(projectId, file, { onProgress }),
    ).rejects.toBeInstanceOf(NetworkError);

    expect(client.post).toHaveBeenCalledTimes(1);
    expect(onProgress.mock.calls.map((call) => call[0])).toEqual([
      { stage: "presign" },
      { stage: "upload", percent: 0 },
    ]);
  });
});
