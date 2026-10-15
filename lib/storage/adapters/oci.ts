/**
 * OCI Object Storage Adapter
 *
 * Wraps the existing OCI storage functionality into the StorageAdapter interface.
 */

import {
  StorageAdapter,
  CreatePresignedUrlOptions,
  PresignedUrlResult,
  type DeleteObjectsResult,
  MAX_DELETE_OBJECTS,
} from "../adapter";
import { StorageProvider } from "../types";
import { createStorageError, StorageErrorCode } from "../errors";
import type { Readable } from "node:stream";

export class OCIStorageAdapter implements StorageAdapter {
  readonly provider = StorageProvider.OCI;

  isConfigured(): boolean {
    return !!(
      process.env.OCI_TENANCY_OCID &&
      process.env.OCI_USER_OCID &&
      process.env.OCI_FINGERPRINT &&
      process.env.OCI_REGION &&
      process.env.OCI_NAMESPACE &&
      process.env.OCI_BUCKET_NAME &&
      (process.env.OCI_PRIVATE_KEY_PATH || process.env.OCI_PRIVATE_KEY_CONTENT)
    );
  }

  async createPresignedUploadUrl(
    options: CreatePresignedUrlOptions,
  ): Promise<PresignedUrlResult> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { createPresignedUploadUrl } = await import("@/lib/oci");
    const result = await createPresignedUploadUrl({
      objectName: options.objectName,
      contentType: options.contentType,
      expiresInMinutes: options.expiresInMinutes,
    });

    return {
      presignedUrl: result.presignedUrl,
      objectUrl: result.objectUrl,
      expiresAt: result.expiresAt,
    };
  }

  private async readContext() {
    const { getObjectStorageClient, getBucketName, getOCINamespace } =
      await import("@/lib/oci");
    const client = getObjectStorageClient();
    const bucketName = getBucketName();
    const namespaceName = getOCINamespace();
    if (!client || !bucketName || !namespaceName)
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    return { client, bucketName, namespaceName };
  }

  async getObjectSize(objectName: string) {
    return (await this.getObjectMetadata(objectName)).size;
  }

  async getObjectMetadata(objectName: string) {
    const { client, ...location } = await this.readContext();
    const response = await client.headObject({ ...location, objectName });
    if (!response.eTag) throw new Error("Missing object revision");
    return { size: response.contentLength, revision: response.eTag };
  }

  async promoteObject(
    sourceObjectName: string,
    destinationObjectName: string,
    sourceRevision: string,
  ) {
    const { client, ...location } = await this.readContext();
    await client.renameObject({
      ...location,
      renameObjectDetails: {
        sourceName: sourceObjectName,
        newName: destinationObjectName,
        srcObjIfMatchETag: sourceRevision,
        newObjIfNoneMatchETag: "*",
      },
    });
  }

  async createReadAccess(objectName: string) {
    const { client, ...location } = await this.readContext();
    const { models } = await import("oci-objectstorage");
    const response = await client.createPreauthenticatedRequest({
      ...location,
      createPreauthenticatedRequestDetails: {
        name: `video-${crypto.randomUUID()}`,
        objectName,
        accessType:
          models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
        timeExpires: new Date(Date.now() + 300_000),
      },
    });
    const par = response.preauthenticatedRequest;
    return {
      url: `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${par.accessUri}`,
      release: async () => {
        await client.deletePreauthenticatedRequest({
          ...location,
          parId: par.id,
        });
      },
    };
  }

  async downloadObject(objectName: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { downloadObject } = await import("@/lib/oci");
    return downloadObject(objectName);
  }

  async uploadObject(
    objectName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { uploadObject } = await import("@/lib/oci");
    return uploadObject(objectName, buffer, contentType);
  }

  async uploadObjectStream(
    objectName: string,
    body: Readable,
    contentType: string,
    contentLength: number,
  ) {
    const { client, ...location } = await this.readContext();
    await client.putObject({
      ...location,
      objectName,
      putObjectBody: body,
      contentType,
      contentLength,
      ifNoneMatch: "*",
    });
  }

  async deleteObject(objectName: string): Promise<void> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { deleteObject } = await import("@/lib/oci");
    await deleteObject(objectName);
  }

  async deleteObjects(objectNames: string[]): Promise<DeleteObjectsResult> {
    const names = [...new Set(objectNames)];
    const result: DeleteObjectsResult = { deleted: [], failed: [] };
    if (!names.length) return result;
    const { client, ...location } = await this.readContext();
    for (let offset = 0; offset < names.length; offset += MAX_DELETE_OBJECTS) {
      const batch = names.slice(offset, offset + MAX_DELETE_OBJECTS);
      try {
        const response = await client.batchDeleteObjects({
          ...location,
          batchDeleteObjectsDetails: {
            objects: batch.map((objectName) => ({ objectName })),
            isSkipDeletedResult: false,
          },
        });
        const deleted = new Set(response.batchDeleteObjectsResult.deleted.map(
          (item) => item.objectName,
        ));
        for (const failure of response.batchDeleteObjectsResult.failed ?? []) {
          if (failure.statusCode === 404) deleted.add(failure.objectName);
          else deleted.delete(failure.objectName);
        }
        for (const name of batch) {
          (deleted.has(name) ? result.deleted : result.failed).push(name);
        }
      } catch {
        result.failed.push(...batch);
      }
    }
    return result;
  }

  getObjectUrl(objectName: string): string {
    const regionId = process.env.OCI_REGION;
    const namespaceName = process.env.OCI_NAMESPACE;
    const bucketName = process.env.OCI_BUCKET_NAME;

    return `https://objectstorage.${regionId}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;
  }
}
