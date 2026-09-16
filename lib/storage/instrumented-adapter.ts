import type {
  CreatePresignedUrlOptions,
  StorageAdapter,
} from "./adapter";
import { observeDependency } from "@/lib/observability/metrics";

export function instrumentStorageAdapter(adapter: StorageAdapter): StorageAdapter {
  const timed = async <T>(operation: string, action: () => Promise<T>) => {
    const start = performance.now();
    try {
      const result = await action();
      observeDependency({
        dependency: "storage",
        operation: `${adapter.provider}.${operation}`,
        durationMs: performance.now() - start,
        success: true,
      });
      return result;
    } catch (error) {
      observeDependency({
        dependency: "storage",
        operation: `${adapter.provider}.${operation}`,
        durationMs: performance.now() - start,
        success: false,
      });
      throw error;
    }
  };

  return {
    provider: adapter.provider,
    isConfigured: () => adapter.isConfigured(),
    getObjectUrl: (objectName: string) => adapter.getObjectUrl(objectName),
    createReadAccess: (objectName: string) =>
      timed("read_access", () => adapter.createReadAccess(objectName)),
    getObjectSize: (objectName: string) =>
      timed("head", () => adapter.getObjectSize(objectName)),
    createPresignedUploadUrl: (options: CreatePresignedUrlOptions) =>
      timed("presign", () => adapter.createPresignedUploadUrl(options)),
    downloadObject: (objectName: string) =>
      timed("download", () => adapter.downloadObject(objectName)),
    uploadObject: (objectName: string, buffer: Buffer, contentType: string) =>
      timed("upload", () =>
        adapter.uploadObject(objectName, buffer, contentType),
      ),
    deleteObject: (objectName: string) =>
      timed("delete", () => adapter.deleteObject(objectName)),
  };
}
