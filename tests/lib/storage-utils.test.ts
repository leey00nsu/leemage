import { describe, it, expect } from "vitest";
import {
  fromPrismaStorageProvider,
  toPrismaStorageProvider,
  isValidStorageProvider,
} from "@/lib/storage/utils";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "@/lib/storage/types";

describe("스토리지 유틸리티", () => {
  describe("fromPrismaStorageProvider", () => {
    it("null 값에 대해 OCI를 반환해야 한다 (하위 호환성)", () => {
      const result = fromPrismaStorageProvider(null);
      expect(result).toBe(StorageProvider.OCI);
    });

    it("undefined 값에 대해 OCI를 반환해야 한다 (하위 호환성)", () => {
      const result = fromPrismaStorageProvider(undefined);
      expect(result).toBe(StorageProvider.OCI);
    });

    it("레거시 프로젝트에 대해 기본 스토리지 프로바이더를 반환해야 한다", () => {
      const result = fromPrismaStorageProvider(null);
      expect(result).toBe(DEFAULT_STORAGE_PROVIDER);
    });

    it("OCI Prisma enum을 StorageProvider.OCI로 변환해야 한다", () => {
      const result = fromPrismaStorageProvider("OCI");
      expect(result).toBe(StorageProvider.OCI);
    });

    it("R2 Prisma enum을 StorageProvider.R2로 변환해야 한다", () => {
      const result = fromPrismaStorageProvider("R2");
      expect(result).toBe(StorageProvider.R2);
    });
  });

  describe("toPrismaStorageProvider", () => {
    it("null 값에 대해 OCI를 반환해야 한다", () => {
      const result = toPrismaStorageProvider(null);
      expect(result).toBe("OCI");
    });

    it("undefined 값에 대해 OCI를 반환해야 한다", () => {
      const result = toPrismaStorageProvider(undefined);
      expect(result).toBe("OCI");
    });

    it("StorageProvider.OCI를 OCI Prisma enum으로 변환해야 한다", () => {
      const result = toPrismaStorageProvider(StorageProvider.OCI);
      expect(result).toBe("OCI");
    });

    it("StorageProvider.R2를 R2 Prisma enum으로 변환해야 한다", () => {
      const result = toPrismaStorageProvider(StorageProvider.R2);
      expect(result).toBe("R2");
    });
  });

  describe("isValidStorageProvider", () => {
    it("유효한 OCI 프로바이더에 대해 true를 반환해야 한다", () => {
      expect(isValidStorageProvider("OCI")).toBe(true);
    });

    it("유효한 R2 프로바이더에 대해 true를 반환해야 한다", () => {
      expect(isValidStorageProvider("R2")).toBe(true);
    });

    it("유효하지 않은 프로바이더에 대해 false를 반환해야 한다", () => {
      expect(isValidStorageProvider("INVALID")).toBe(false);
    });

    it("빈 문자열에 대해 false를 반환해야 한다", () => {
      expect(isValidStorageProvider("")).toBe(false);
    });

    it("소문자 프로바이더 이름에 대해 false를 반환해야 한다", () => {
      expect(isValidStorageProvider("oci")).toBe(false);
      expect(isValidStorageProvider("r2")).toBe(false);
    });
  });

  describe("왕복 변환", () => {
    it("왕복 변환 시 OCI를 유지해야 한다", () => {
      const original = StorageProvider.OCI;
      const prisma = toPrismaStorageProvider(original);
      const result = fromPrismaStorageProvider(prisma);
      expect(result).toBe(original);
    });

    it("왕복 변환 시 R2를 유지해야 한다", () => {
      const original = StorageProvider.R2;
      const prisma = toPrismaStorageProvider(original);
      const result = fromPrismaStorageProvider(prisma);
      expect(result).toBe(original);
    });
  });
});
