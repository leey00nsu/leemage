/**
 * OCI Storage Adapter Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 5: Missing Credentials Disables Provider**
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OCIStorageAdapter } from "@/lib/storage/adapters/oci";
import { StorageProvider } from "@/lib/storage/types";
import { StorageErrorCode } from "@/lib/storage/errors";

describe("OCIStorageAdapter", () => {
  let adapter: OCIStorageAdapter;

  beforeEach(() => {
    adapter = new OCIStorageAdapter();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("provider", () => {
    it("should have OCI as provider type", () => {
      expect(adapter.provider).toBe(StorageProvider.OCI);
    });
  });

  describe("isConfigured", () => {
    it("should return false when no env vars are set", () => {
      vi.stubEnv("OCI_TENANCY_OCID", "");
      vi.stubEnv("OCI_USER_OCID", "");
      vi.stubEnv("OCI_FINGERPRINT", "");
      vi.stubEnv("OCI_REGION", "");
      vi.stubEnv("OCI_NAMESPACE", "");
      vi.stubEnv("OCI_BUCKET_NAME", "");
      vi.stubEnv("OCI_PRIVATE_KEY_PATH", "");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "");

      const newAdapter = new OCIStorageAdapter();
      expect(newAdapter.isConfigured()).toBe(false);
    });

    it("should return false when some required env vars are missing", () => {
      vi.stubEnv("OCI_TENANCY_OCID", "test-tenancy");
      vi.stubEnv("OCI_USER_OCID", "test-user");
      vi.stubEnv("OCI_FINGERPRINT", "");
      vi.stubEnv("OCI_REGION", "test-region");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "test-key");

      const newAdapter = new OCIStorageAdapter();
      expect(newAdapter.isConfigured()).toBe(false);
    });

    it("should return true when all required env vars are set with private key path", () => {
      vi.stubEnv("OCI_TENANCY_OCID", "test-tenancy");
      vi.stubEnv("OCI_USER_OCID", "test-user");
      vi.stubEnv("OCI_FINGERPRINT", "test-fingerprint");
      vi.stubEnv("OCI_REGION", "test-region");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");
      vi.stubEnv("OCI_PRIVATE_KEY_PATH", "/path/to/key");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "");

      const newAdapter = new OCIStorageAdapter();
      expect(newAdapter.isConfigured()).toBe(true);
    });

    it("should return true when all required env vars are set with private key content", () => {
      vi.stubEnv("OCI_TENANCY_OCID", "test-tenancy");
      vi.stubEnv("OCI_USER_OCID", "test-user");
      vi.stubEnv("OCI_FINGERPRINT", "test-fingerprint");
      vi.stubEnv("OCI_REGION", "test-region");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");
      vi.stubEnv("OCI_PRIVATE_KEY_PATH", "");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "test-key-content");

      const newAdapter = new OCIStorageAdapter();
      expect(newAdapter.isConfigured()).toBe(true);
    });
  });

  describe("getObjectUrl", () => {
    it("should generate correct OCI object URL", () => {
      vi.stubEnv("OCI_REGION", "ap-seoul-1");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");

      const newAdapter = new OCIStorageAdapter();
      const url = newAdapter.getObjectUrl("project123/file.jpg");

      expect(url).toBe(
        "https://objectstorage.ap-seoul-1.oraclecloud.com/n/test-namespace/b/test-bucket/o/project123/file.jpg"
      );
    });
  });

  describe("operations when not configured", () => {
    beforeEach(() => {
      vi.stubEnv("OCI_TENANCY_OCID", "");
      vi.stubEnv("OCI_USER_OCID", "");
      vi.stubEnv("OCI_FINGERPRINT", "");
      vi.stubEnv("OCI_REGION", "");
      vi.stubEnv("OCI_NAMESPACE", "");
      vi.stubEnv("OCI_BUCKET_NAME", "");
      vi.stubEnv("OCI_PRIVATE_KEY_PATH", "");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "");
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on createPresignedUploadUrl", async () => {
      const newAdapter = new OCIStorageAdapter();

      await expect(
        newAdapter.createPresignedUploadUrl({
          objectName: "test.jpg",
          contentType: "image/jpeg",
        })
      ).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on downloadObject", async () => {
      const newAdapter = new OCIStorageAdapter();

      await expect(newAdapter.downloadObject("test.jpg")).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on uploadObject", async () => {
      const newAdapter = new OCIStorageAdapter();

      await expect(
        newAdapter.uploadObject("test.jpg", Buffer.from("test"), "image/jpeg")
      ).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on deleteObject", async () => {
      const newAdapter = new OCIStorageAdapter();

      await expect(newAdapter.deleteObject("test.jpg")).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });
  });
});
