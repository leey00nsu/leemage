import { describe, it, expect } from "vitest";
import { createProjectRequestSchema } from "@/lib/openapi/schemas/projects";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "@/lib/storage/types";

describe("프로젝트 스토리지 프로바이더", () => {
  describe("createProjectRequestSchema", () => {
    it("storageProvider가 제공되지 않았을 때 OCI를 기본값으로 사용해야 한다", () => {
      const input = {
        name: "Test Project",
        description: "Test description",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.OCI);
      expect(result.storageProvider).toBe(DEFAULT_STORAGE_PROVIDER);
    });

    it("storageProvider로 OCI를 허용해야 한다", () => {
      const input = {
        name: "Test Project",
        storageProvider: "OCI",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.OCI);
    });

    it("storageProvider로 R2를 허용해야 한다", () => {
      const input = {
        name: "Test Project",
        storageProvider: "R2",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.R2);
    });

    it("유효하지 않은 storageProvider 값을 거부해야 한다", () => {
      const input = {
        name: "Test Project",
        storageProvider: "INVALID",
      };

      expect(() => createProjectRequestSchema.parse(input)).toThrow();
    });

    it("파싱을 통해 storageProvider를 보존해야 한다", () => {
      const providers = [StorageProvider.OCI, StorageProvider.R2];

      providers.forEach((provider) => {
        const input = {
          name: "Test Project",
          storageProvider: provider,
        };

        const result = createProjectRequestSchema.parse(input);
        expect(result.storageProvider).toBe(provider);
      });
    });
  });

  describe("스키마 유효성 검사", () => {
    it("이름 길이 제약조건을 검증해야 한다", () => {
      // 너무 짧음
      expect(() =>
        createProjectRequestSchema.parse({
          name: "ab",
          storageProvider: "OCI",
        }),
      ).toThrow();

      // 유효한 길이
      const validResult = createProjectRequestSchema.parse({
        name: "Valid Name",
        storageProvider: "OCI",
      });
      expect(validResult.name).toBe("Valid Name");
    });

    it("설명 길이 제약조건을 검증해야 한다", () => {
      const longDescription = "a".repeat(201);

      expect(() =>
        createProjectRequestSchema.parse({
          name: "Test Project",
          description: longDescription,
          storageProvider: "OCI",
        }),
      ).toThrow();
    });
  });
});
