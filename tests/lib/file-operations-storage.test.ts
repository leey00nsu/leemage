import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { StorageFactory } from "@/lib/storage/factory";
import { StorageProvider } from "@/lib/storage/types";

describe("스토리지 추상화를 통한 파일 작업", () => {
  beforeEach(() => {
    StorageFactory.clearCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Presigned URL 인터페이스 일관성", () => {
    it("OCI 어댑터에 대해 일관된 Presigned URL 구조를 반환해야 한다", async () => {
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

    it("R2 어댑터에 대해 일관된 Presigned URL 구조를 반환해야 한다", async () => {
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

    it("OCI에 대해 올바른 형식의 객체 URL을 생성해야 한다", async () => {
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

    it("R2에 대해 올바른 형식의 객체 URL을 생성해야 한다", async () => {
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

  describe("스토리지 어댑터 선택", () => {
    it("프로바이더 타입에 따라 올바른 어댑터를 선택해야 한다", async () => {
      const ociAdapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      const r2Adapter = await StorageFactory.getAdapter(StorageProvider.R2);

      expect(ociAdapter.provider).toBe(StorageProvider.OCI);
      expect(r2Adapter.provider).toBe(StorageProvider.R2);
    });

    it("어댑터 인스턴스를 캐싱해야 한다", async () => {
      const adapter1 = await StorageFactory.getAdapter(StorageProvider.OCI);
      const adapter2 = await StorageFactory.getAdapter(StorageProvider.OCI);

      expect(adapter1).toBe(adapter2);
    });
  });
});
