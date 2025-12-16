/**
 * Cloudflare R2 Storage Adapter Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 5: Missing Credentials Disables Provider**
 * **Validates: Requirements 4.1, 4.2**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CloudflareR2Adapter } from "@/lib/storage/adapters/r2";
import { StorageProvider } from "@/lib/storage/types";
import { StorageErrorCode } from "@/lib/storage/errors";

describe("CloudflareR2Adapter", () => {
  let adapter: CloudflareR2Adapter;

  beforeEach(() => {
    adapter = new CloudflareR2Adapter();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("provider", () => {
    it("should have R2 as provider type", () => {
      expect(adapter.provider).toBe(StorageProvider.R2);
    });
  });

  describe("isConfigured", () => {
    it("should return false when no env vars are set", () => {
      vi.stubEnv("R2_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");

      const newAdapter = new CloudflareR2Adapter();
      expect(newAdapter.isConfigured()).toBe(false);
    });

    it("should return false when some required env vars are missing", () => {
      vi.stubEnv("R2_ACCOUNT_ID", "test-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

      const newAdapter = new CloudflareR2Adapter();
      expect(newAdapter.isConfigured()).toBe(false);
    });

    it("should return true when all required env vars are set", () => {
      vi.stubEnv("R2_ACCOUNT_ID", "test-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
      vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

      const newAdapter = new CloudflareR2Adapter();
      expect(newAdapter.isConfigured()).toBe(true);
    });
  });

  describe("getObjectUrl", () => {
    it("should generate correct R2 object URL with public URL", () => {
      vi.stubEnv("R2_ACCOUNT_ID", "abc123");
      vi.stubEnv("R2_BUCKET_NAME", "my-bucket");
      vi.stubEnv("R2_PUBLIC_URL", "https://assets.example.com");

      const newAdapter = new CloudflareR2Adapter();
      const url = newAdapter.getObjectUrl("project123/file.jpg");

      expect(url).toBe("https://assets.example.com/project123/file.jpg");
    });

    it("should generate fallback URL when R2_PUBLIC_URL is not set", () => {
      vi.stubEnv("R2_ACCOUNT_ID", "abc123");
      vi.stubEnv("R2_BUCKET_NAME", "my-bucket");
      vi.stubEnv("R2_PUBLIC_URL", "");

      const newAdapter = new CloudflareR2Adapter();
      const url = newAdapter.getObjectUrl("project123/file.jpg");

      expect(url).toBe(
        "https://abc123.r2.cloudflarestorage.com/my-bucket/project123/file.jpg"
      );
    });
  });

  describe("operations when not configured", () => {
    beforeEach(() => {
      vi.stubEnv("R2_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on createPresignedUploadUrl", async () => {
      const newAdapter = new CloudflareR2Adapter();

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
      const newAdapter = new CloudflareR2Adapter();

      await expect(newAdapter.downloadObject("test.jpg")).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on uploadObject", async () => {
      const newAdapter = new CloudflareR2Adapter();

      await expect(
        newAdapter.uploadObject("test.jpg", Buffer.from("test"), "image/jpeg")
      ).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });

    it("should throw PROVIDER_NOT_CONFIGURED error on deleteObject", async () => {
      const newAdapter = new CloudflareR2Adapter();

      await expect(newAdapter.deleteObject("test.jpg")).rejects.toMatchObject({
        code: StorageErrorCode.PROVIDER_NOT_CONFIGURED,
      });
    });
  });
});
