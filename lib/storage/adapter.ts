/**
 * Storage Adapter Interface
 * 
 * Defines the contract that all storage provider implementations must follow.
 */

import { StorageProvider } from "./types";

export interface CreatePresignedUrlOptions {
  objectName: string;
  contentType: string;
  expiresInMinutes?: number;
}

export interface PresignedUrlResult {
  presignedUrl: string;
  objectUrl: string;
  expiresAt: Date;
}

export interface StorageAdapter {
  readonly provider: StorageProvider;

  /**
   * Creates a presigned URL for uploading a file directly to storage.
   */
  createPresignedUploadUrl(options: CreatePresignedUrlOptions): Promise<PresignedUrlResult>;

  /**
   * Downloads an object from storage and returns its contents as a Buffer.
   */
  downloadObject(objectName: string): Promise<Buffer>;

  /**
   * Uploads a file to storage and returns the object URL.
   */
  uploadObject(objectName: string, buffer: Buffer, contentType: string): Promise<string>;

  /**
   * Deletes an object from storage.
   */
  deleteObject(objectName: string): Promise<void>;

  /**
   * Returns the public URL for an object.
   */
  getObjectUrl(objectName: string): string;

  /**
   * Checks if the adapter is properly configured with required credentials.
   */
  isConfigured(): boolean;
}
