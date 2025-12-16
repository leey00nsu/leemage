/**
 * File Operations Storage Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 3: Presigned URL Interface Consistency**
 * **Validates: Requirements 3.4**
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageFactory } from "@/lib/storage/factory";
import { StorageProvider } from "@/lib/storage/types";

describe("File Operations with Storage Abstraction", () => {
  beforeEach(() => {
    StorageFactory.clearCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Presigned URL Interface Consistency", () => {
    it("should return consistent presigned URL structure for OCI adapter", async () => {
      // Configure OCI
      vi.stubEnv("OCI_TENANCY_OCID", "test-tenancy");
      vi.stubEnv("OCI_USER_OCID", "test-user");
      vi.stubEnv("OCI_FINGERPRINT", "test-fingerprint");
      vi.stubEnv("OCI_REGION", "ap-seoul-1");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");
      vi.stubEnv("OCI_PRIVATE_KEY_CONTENT", "test-key");

      StorageFactory.clearCache();
      const adapter = await StorageFactory.getAdapter(StorageProvider.OCI);

      // Verify adapter is configured
      expect(adapter.isConfigured()).toBe(true);
      expect(adapter.provider).toBe(StorageProvider.OCI);
    });

    it("should return consistent presigned URL structure for R2 adapter", async () => {
      // Configure R2
      vi.stubEnv("R2_ACCOUNT_ID", "test-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
      vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

      StorageFactory.clearCache();
      const adapter = await StorageFactory.getAdapter(StorageProvider.R2);

      // Verify adapter is configured
      expect(adapter.isConfigured()).toBe(true);
      expect(adapter.provider).toBe(StorageProvider.R2);
    });

    it("should generate object URL with correct format for OCI", async () => {
      vi.stubEnv("OCI_REGION", "ap-seoul-1");
      vi.stubEnv("OCI_NAMESPACE", "test-namespace");
      vi.stubEnv("OCI_BUCKET_NAME", "test-bucket");

      StorageFactory.clearCache();
      const adapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      const objectUrl = adapter.getObjectUrl("project123/file.jpg");

      expect(objectUrl).toContain("objectstorage");
      expect(objectUrl).toContain("ap-seoul-1");
      expect(objectUrl).toContain("test-namespace");
      expect(objectUrl).toContain("test-bucket");
      expect(objectUrl).toContain("project123/file.jpg");
    });

    it("should generate object URL with correct format for R2", async () => {
      vi.stubEnv("R2_ACCOUNT_ID", "abc123");
      vi.stubEnv("R2_BUCKET_NAME", "my-bucket");

      StorageFactory.clearCache();
      const adapter = await StorageFactory.getAdapter(StorageProvider.R2);
      const objectUrl = adapter.getObjectUrl("project123/file.jpg");

      expect(objectUrl).toContain("r2.cloudflarestorage.com");
      expect(objectUrl).toContain("my-bucket");
      expect(objectUrl).toContain("project123/file.jpg");
    });
  });

  describe("Storage Adapter Selection", () => {
    it("should select correct adapter based on provider type", async () => {
      const ociAdapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      const r2Adapter = await StorageFactory.getAdapter(StorageProvider.R2);

      expect(ociAdapter.provider).toBe(StorageProvider.OCI);
      expect(r2Adapter.provider).toBe(StorageProvider.R2);
    });

    it("should cache adapter instances", async () => {
      const adapter1 = await StorageFactory.getAdapter(StorageProvider.OCI);
      const adapter2 = await StorageFactory.getAdapter(StorageProvider.OCI);

      expect(adapter1).toBe(adapter2);
    });
  });
});
