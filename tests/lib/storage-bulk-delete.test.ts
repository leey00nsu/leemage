import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ send: vi.fn(), batchDelete: vi.fn() }));
vi.mock("@aws-sdk/client-s3", async (importOriginal) => ({
  ...await importOriginal<typeof import("@aws-sdk/client-s3")>(),
  S3Client: class { send = mocks.send; },
  DeleteObjectsCommand: class {
    constructor(public input: unknown) {}
  },
}));
vi.mock("@/lib/oci", () => ({
  getObjectStorageClient: () => ({ batchDeleteObjects: mocks.batchDelete }),
  getBucketName: () => "test-bucket",
  getOCINamespace: () => "test-namespace",
}));

import { CloudflareR2Adapter } from "@/lib/storage/adapters/r2";
import { OCIStorageAdapter } from "@/lib/storage/adapters/oci";
import { instrumentStorageAdapter } from "@/lib/storage/instrumented-adapter";

beforeEach(() => {
  vi.resetAllMocks();
  for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"]) {
    vi.stubEnv(name, "test");
  }
  mocks.send.mockImplementation(async (command) => ({
    Deleted: command.input.Delete.Objects,
  }));
  mocks.batchDelete.mockImplementation(async (request) => ({
    batchDeleteObjectsResult: { deleted: request.batchDeleteObjectsDetails.objects },
  }));
});
afterEach(() => vi.unstubAllEnvs());

describe("R2 native bulk deletion", () => {
  it("sends one DeleteObjects request for 100 objects", async () => {
    const names = Array.from({ length: 100 }, (_, i) => `project/${i}.txt`);
    await expect(new CloudflareR2Adapter().deleteObjects(names)).resolves.toEqual({ deleted: names, failed: [] });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.send.mock.calls[0][0].input).toEqual({
      Bucket: "test", Delete: { Objects: names.map((Key) => ({ Key })), Quiet: false },
    });
  });

  it("splits at 1000 keys and deduplicates", async () => {
    const names = Array.from({ length: 1001 }, (_, i) => `p/${i}`);
    await expect(new CloudflareR2Adapter().deleteObjects([...names, names[0]])).resolves.toEqual({ deleted: names, failed: [] });
    expect(mocks.send.mock.calls.map(([command]) => command.input.Delete.Objects.length)).toEqual([1000, 1]);
  });

  it("reports partial failures and treats missing objects as deleted", async () => {
    mocks.send.mockResolvedValue({
      Deleted: [{ Key: "ok" }],
      Errors: [{ Key: "denied", Code: "AccessDenied" }, { Key: "missing", Code: "NoSuchKey" }],
    });
    await expect(new CloudflareR2Adapter().deleteObjects(["ok", "denied", "missing", "unknown"])).resolves.toEqual({
      deleted: ["ok", "missing"], failed: ["denied", "unknown"],
    });
  });

  it("preserves a failed chunk while continuing subsequent chunks", async () => {
    mocks.send.mockRejectedValueOnce(new Error("network failure"));
    const names = Array.from({ length: 1001 }, (_, i) => `p/${i}`);
    await expect(new CloudflareR2Adapter().deleteObjects(names)).resolves.toEqual({
      deleted: [names[1000]], failed: names.slice(0, 1000),
    });
  });
});

describe("OCI native batch deletion", () => {
  it("sends one batchDeleteObjects request for 100 objects", async () => {
    const names = Array.from({ length: 100 }, (_, i) => `project/${i}.txt`);
    await expect(new OCIStorageAdapter().deleteObjects(names)).resolves.toEqual({ deleted: names, failed: [] });
    expect(mocks.batchDelete).toHaveBeenCalledExactlyOnceWith({
      namespaceName: "test-namespace", bucketName: "test-bucket",
      batchDeleteObjectsDetails: {
        objects: names.map((objectName) => ({ objectName })), isSkipDeletedResult: false,
      },
    });
  });

  it("splits at 1000 objects and deduplicates", async () => {
    const names = Array.from({ length: 1001 }, (_, i) => `p/${i}`);
    await expect(new OCIStorageAdapter().deleteObjects([...names, names[0]])).resolves.toEqual({ deleted: names, failed: [] });
    expect(mocks.batchDelete.mock.calls.map(([request]) => request.batchDeleteObjectsDetails.objects.length)).toEqual([1000, 1]);
  });

  it("retries only actual failures and unreported objects", async () => {
    mocks.batchDelete.mockResolvedValue({ batchDeleteObjectsResult: {
      deleted: [{ objectName: "ok" }],
      failed: [{ objectName: "missing", statusCode: 404 }, { objectName: "denied", statusCode: 403 }],
    } });
    await expect(new OCIStorageAdapter().deleteObjects(["ok", "denied", "missing", "unknown"])).resolves.toEqual({
      deleted: ["ok", "missing"], failed: ["denied", "unknown"],
    });
  });

  it("keeps the entire batch retryable on request failure", async () => {
    mocks.batchDelete.mockRejectedValue(new Error("timeout"));
    await expect(new OCIStorageAdapter().deleteObjects(["a", "b"])).resolves.toEqual({ deleted: [], failed: ["a", "b"] });
  });
});

it("does no provider I/O for an empty batch", async () => {
  await expect(new CloudflareR2Adapter().deleteObjects([])).resolves.toEqual({ deleted: [], failed: [] });
  await expect(new OCIStorageAdapter().deleteObjects([])).resolves.toEqual({ deleted: [], failed: [] });
  expect(mocks.send).not.toHaveBeenCalled();
  expect(mocks.batchDelete).not.toHaveBeenCalled();
});

it("exposes bulk deletion through the instrumented adapter", async () => {
  await expect(instrumentStorageAdapter(new CloudflareR2Adapter()).deleteObjects(["a", "b"])).resolves.toEqual({ deleted: ["a", "b"], failed: [] });
  expect(mocks.send).toHaveBeenCalledTimes(1);
});
