import type {
  CreatePresignedUrlOptions,
  StorageAdapter,
} from "./adapter";
import { observeDependency } from "@/lib/observability/metrics";
import type { Readable } from "node:stream";

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
    getObjectMetadata: (objectName: string) =>
      timed("head_metadata", () => adapter.getObjectMetadata(objectName)),
    promoteObject: (
      sourceObjectName: string,
      destinationObjectName: string,
      sourceRevision: string,
    ) =>
      timed("promote", () =>
        adapter.promoteObject(
          sourceObjectName,
          destinationObjectName,
          sourceRevision,
        ),
      ),
    createPresignedUploadUrl: (options: CreatePresignedUrlOptions) =>
      timed("presign", () => adapter.createPresignedUploadUrl(options)),
    downloadObject: (objectName: string) =>
      timed("download", () => adapter.downloadObject(objectName)),
    uploadObject: (objectName: string, buffer: Buffer, contentType: string) =>
      timed("upload", () =>
        adapter.uploadObject(objectName, buffer, contentType),
      ),
    uploadObjectStream: (
      objectName: string,
      body: Readable,
      contentType: string,
      contentLength: number,
    ) =>
      timed("upload_stream", () =>
        adapter.uploadObjectStream(
          objectName,
          body,
          contentType,
          contentLength,
        ),
      ),
    deleteObject: (objectName: string) =>
      timed("delete", () => adapter.deleteObject(objectName)),
    deleteObjects: (objectNames: string[]) =>
      timed("delete_batch", () => adapter.deleteObjects(objectNames)),
  };
}
