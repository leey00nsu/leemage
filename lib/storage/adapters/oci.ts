/**
 * OCI Object Storage Adapter
 * 
 * Wraps the existing OCI storage functionality into the StorageAdapter interface.
 */

import { StorageAdapter, CreatePresignedUrlOptions, PresignedUrlResult } from "../adapter";
import { StorageProvider } from "../types";
import { createStorageError, StorageErrorCode } from "../errors";

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

  async createPresignedUploadUrl(options: CreatePresignedUrlOptions): Promise<PresignedUrlResult> {
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

  async downloadObject(objectName: string): Promise<Buffer> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { downloadObject } = await import("@/lib/oci");
    return downloadObject(objectName);
  }

  async uploadObject(objectName: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { uploadObject } = await import("@/lib/oci");
    return uploadObject(objectName, buffer, contentType);
  }

  async deleteObject(objectName: string): Promise<void> {
    if (!this.isConfigured()) {
      throw createStorageError(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
    }

    const { deleteObject } = await import("@/lib/oci");
    await deleteObject(objectName);
  }

  getObjectUrl(objectName: string): string {
    const regionId = process.env.OCI_REGION;
    const namespaceName = process.env.OCI_NAMESPACE;
    const bucketName = process.env.OCI_BUCKET_NAME;

    return `https://objectstorage.${regionId}.oraclecloud.com/n/${namespaceName}/b/${bucketName}/o/${objectName}`;
  }
}
