/**
 * Storage Factory Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 1: Default Storage Provider**
 * **Feature: multi-storage-provider, Property 5: Missing Credentials Disables Provider**
 * **Validates: Requirements 3.1, 4.3, 5.1**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { StorageFactory } from "@/lib/storage/factory";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "@/lib/storage/types";
import {
  translateStorageError,
  StorageError,
  StorageErrorCode,
  STORAGE_ERROR_MESSAGES,
} from "@/lib/storage/errors";

describe("StorageFactory", () => {
  beforeEach(() => {
    StorageFactory.clearCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("getAdapter", () => {
    it("should return OCI adapter for OCI provider", async () => {
      const adapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      expect(adapter.provider).toBe(StorageProvider.OCI);
    });

    it("should return R2 adapter for R2 provider", async () => {
      const adapter = await StorageFactory.getAdapter(StorageProvider.R2);
      expect(adapter.provider).toBe(StorageProvider.R2);
    });

    it("should cache adapter instances", async () => {
      const adapter1 = await StorageFactory.getAdapter(StorageProvider.OCI);
      const adapter2 = await StorageFactory.getAdapter(StorageProvider.OCI);
      expect(adapter1).toBe(adapter2);
    });

    it("should return different adapters for different providers", async () => {
      const ociAdapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      const r2Adapter = await StorageFactory.getAdapter(StorageProvider.R2);
      expect(ociAdapter).not.toBe(r2Adapter);
      expect(ociAdapter.provider).toBe(StorageProvider.OCI);
      expect(r2Adapter.provider).toBe(StorageProvider.R2);
    });
  });

  describe("getAvailableProviders", () => {
    it("should return empty array when no providers are configured", async () => {
      // Clear all storage-related env vars
      vi.stubEnv("OCI_TENANCY_OCID", "");
      vi.stubEnv("R2_ACCOUNT_ID", "");

      StorageFactory.clearCache();
      const providers = await StorageFactory.getAvailableProviders();
      expect(providers).toEqual([]);
    });

    it("should return only configured providers", async () => {
      // Configure only OCI
      vi.stubEnv("OCI_TENANCY_OCID", "test-tenancy");
      vi.stubEnv("OCI_USER_OCID", "test-user");
      vi.stubEnv("OCI_FINGERPRINT", "test-fingerprint");
      vi.stubEnv("OCI_REGION", "test-region");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "test-key");
      vi.stubEnv("R2_ACCOUNT_ID", "");

      StorageFactory.clearCache();
      const providers = await StorageFactory.getAvailableProviders();
      expect(providers).toContain(StorageProvider.OCI);
      expect(providers).not.toContain(StorageProvider.R2);
    });
  });

  describe("isProviderAvailable", () => {
    it("should return false for unconfigured provider", async () => {
      vi.stubEnv("R2_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");

      StorageFactory.clearCache();
      const isAvailable = await StorageFactory.isProviderAvailable(StorageProvider.R2);
      expect(isAvailable).toBe(false);
    });

    it("should return true for configured provider", async () => {
      vi.stubEnv("R2_ACCOUNT_ID", "test-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
      vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

      StorageFactory.clearCache();
      const isAvailable = await StorageFactory.isProviderAvailable(StorageProvider.R2);
      expect(isAvailable).toBe(true);
    });
  });
});

describe("Storage Types", () => {
  it("should have OCI as default storage provider", () => {
    expect(DEFAULT_STORAGE_PROVIDER).toBe(StorageProvider.OCI);
  });
});

describe("translateStorageError", () => {
  it("should return user-friendly message for not found errors", () => {
    const error = new Error("Object not found in bucket");
    const storageError = translateStorageError(error);

    expect(storageError).toBeInstanceOf(StorageError);
    expect(storageError.code).toBe(StorageErrorCode.OBJECT_NOT_FOUND);
    expect(storageError.userMessage).toBe(STORAGE_ERROR_MESSAGES[StorageErrorCode.OBJECT_NOT_FOUND]);
  });

  it("should return user-friendly message for upload errors", () => {
    const error = new Error("Failed to upload file");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.UPLOAD_FAILED);
    expect(storageError.userMessage).toBe(STORAGE_ERROR_MESSAGES[StorageErrorCode.UPLOAD_FAILED]);
  });

  it("should return user-friendly message for download errors", () => {
    const error = new Error("Failed to download object");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.DOWNLOAD_FAILED);
  });

  it("should return user-friendly message for delete errors", () => {
    const error = new Error("Failed to delete object");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.DELETE_FAILED);
  });

  it("should return user-friendly message for configuration errors", () => {
    const error = new Error("Provider not configured");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
  });

  it("should return unknown error for unrecognized errors", () => {
    const error = new Error("Something unexpected happened");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.UNKNOWN_ERROR);
    expect(storageError.userMessage).toBe(STORAGE_ERROR_MESSAGES[StorageErrorCode.UNKNOWN_ERROR]);
  });

  it("should not expose internal error details in user message", () => {
    const error = new Error("Internal stack trace: at /app/lib/storage/oci.ts:123");
    const storageError = translateStorageError(error);

    expect(storageError.userMessage).not.toContain("stack trace");
    expect(storageError.userMessage).not.toContain("/app/lib");
    expect(storageError.userMessage).not.toContain(".ts:");
  });

  it("should preserve original error for debugging", () => {
    const originalError = new Error("Original error message");
    const storageError = translateStorageError(originalError);

    expect(storageError.originalError).toBe(originalError);
  });

  it("should pass through existing StorageError instances", () => {
    const existingError = new StorageError(
      StorageErrorCode.PRESIGN_FAILED,
      "Custom message",
      undefined
    );
    const result = translateStorageError(existingError);

    expect(result).toBe(existingError);
  });
});
