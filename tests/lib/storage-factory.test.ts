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
    it("OCI 프로바이더에 대해 OCI 어댑터를 반환해야 한다", async () => {
      const adapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      expect(adapter.provider).toBe(StorageProvider.OCI);
    });

    it("R2 프로바이더에 대해 R2 어댑터를 반환해야 한다", async () => {
      const adapter = await StorageFactory.getAdapter(StorageProvider.R2);
      expect(adapter.provider).toBe(StorageProvider.R2);
    });

    it("어댑터 인스턴스를 캐싱해야 한다", async () => {
      const adapter1 = await StorageFactory.getAdapter(StorageProvider.OCI);
      const adapter2 = await StorageFactory.getAdapter(StorageProvider.OCI);
      expect(adapter1).toBe(adapter2);
    });

    it("다른 프로바이더에 대해 다른 어댑터를 반환해야 한다", async () => {
      const ociAdapter = await StorageFactory.getAdapter(StorageProvider.OCI);
      const r2Adapter = await StorageFactory.getAdapter(StorageProvider.R2);
      expect(ociAdapter).not.toBe(r2Adapter);
      expect(ociAdapter.provider).toBe(StorageProvider.OCI);
      expect(r2Adapter.provider).toBe(StorageProvider.R2);
    });
  });

  describe("getAvailableProviders", () => {
    it("프로바이더 미설정 시 빈 배열을 반환해야 한다", async () => {
      // 스토리지 관련 환경변수 모두 삭제
      vi.stubEnv("OCI_TENANCY_OCID", "");
      vi.stubEnv("R2_ACCOUNT_ID", "");

      StorageFactory.clearCache();
      const providers = await StorageFactory.getAvailableProviders();
      expect(providers).toEqual([]);
    });

    it("설정된 프로바이더만 반환해야 한다", async () => {
      // OCI만 설정
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
    it("미설정 프로바이더에 대해 false를 반환해야 한다", async () => {
      vi.stubEnv("R2_ACCOUNT_ID", "");
      vi.stubEnv("R2_ACCESS_KEY_ID", "");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
      vi.stubEnv("R2_BUCKET_NAME", "");

      StorageFactory.clearCache();
      const isAvailable = await StorageFactory.isProviderAvailable(
        StorageProvider.R2,
      );
      expect(isAvailable).toBe(false);
    });

    it("설정된 프로바이더에 대해 true를 반환해야 한다", async () => {
      vi.stubEnv("R2_ACCOUNT_ID", "test-account");
      vi.stubEnv("R2_ACCESS_KEY_ID", "test-key-id");
      vi.stubEnv("R2_SECRET_ACCESS_KEY", "test-secret");
      vi.stubEnv("R2_BUCKET_NAME", "test-bucket");

      StorageFactory.clearCache();
      const isAvailable = await StorageFactory.isProviderAvailable(
        StorageProvider.R2,
      );
      expect(isAvailable).toBe(true);
    });
  });
});

describe("스토리지 타입", () => {
  it("OCI가 기본 스토리지 프로바이더여야 한다", () => {
    expect(DEFAULT_STORAGE_PROVIDER).toBe(StorageProvider.OCI);
  });
});

describe("translateStorageError", () => {
  it("미발견 오류에 대해 사용자 친화적 메시지를 반환해야 한다", () => {
    const error = new Error("Object not found in bucket");
    const storageError = translateStorageError(error);

    expect(storageError).toBeInstanceOf(StorageError);
    expect(storageError.code).toBe(StorageErrorCode.OBJECT_NOT_FOUND);
    expect(storageError.userMessage).toBe(
      STORAGE_ERROR_MESSAGES[StorageErrorCode.OBJECT_NOT_FOUND],
    );
  });

  it("업로드 오류에 대해 사용자 친화적 메시지를 반환해야 한다", () => {
    const error = new Error("Failed to upload file");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.UPLOAD_FAILED);
    expect(storageError.userMessage).toBe(
      STORAGE_ERROR_MESSAGES[StorageErrorCode.UPLOAD_FAILED],
    );
  });

  it("다운로드 오류에 대해 사용자 친화적 메시지를 반환해야 한다", () => {
    const error = new Error("Failed to download object");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.DOWNLOAD_FAILED);
  });

  it("삭제 오류에 대해 사용자 친화적 메시지를 반환해야 한다", () => {
    const error = new Error("Failed to delete object");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.DELETE_FAILED);
  });

  it("설정 오류에 대해 사용자 친화적 메시지를 반환해야 한다", () => {
    const error = new Error("Provider not configured");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.PROVIDER_NOT_CONFIGURED);
  });

  it("인식되지 않은 오류에 대해 알 수 없는 오류를 반환해야 한다", () => {
    const error = new Error("Something unexpected happened");
    const storageError = translateStorageError(error);

    expect(storageError.code).toBe(StorageErrorCode.UNKNOWN_ERROR);
    expect(storageError.userMessage).toBe(
      STORAGE_ERROR_MESSAGES[StorageErrorCode.UNKNOWN_ERROR],
    );
  });

  it("사용자 메시지에 내부 오류 세부정보를 노출하지 않아야 한다", () => {
    const error = new Error(
      "Internal stack trace: at /app/lib/storage/oci.ts:123",
    );
    const storageError = translateStorageError(error);

    expect(storageError.userMessage).not.toContain("stack trace");
    expect(storageError.userMessage).not.toContain("/app/lib");
    expect(storageError.userMessage).not.toContain(".ts:");
  });

  it("디버깅을 위한 원본 오류를 보존해야 한다", () => {
    const originalError = new Error("Original error message");
    const storageError = translateStorageError(originalError);

    expect(storageError.originalError).toBe(originalError);
  });

  it("기존 StorageError 인스턴스를 통과시켜야 한다", () => {
    const existingError = new StorageError(
      StorageErrorCode.PRESIGN_FAILED,
      "Custom message",
      undefined,
    );
    const result = translateStorageError(existingError);

    expect(result).toBe(existingError);
  });
});
