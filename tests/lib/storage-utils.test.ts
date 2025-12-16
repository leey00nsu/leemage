/**
 * Storage Utils Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 7: Backward Compatibility for Legacy Projects**
 * **Validates: Requirements 6.1, 6.3**
 */

import { describe, it, expect } from "vitest";
import {
  fromPrismaStorageProvider,
  toPrismaStorageProvider,
  isValidStorageProvider,
} from "@/lib/storage/utils";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "@/lib/storage/types";

describe("Storage Utils", () => {
  describe("fromPrismaStorageProvider", () => {
    it("should return OCI for null value (backward compatibility)", () => {
      const result = fromPrismaStorageProvider(null);
      expect(result).toBe(StorageProvider.OCI);
    });

    it("should return OCI for undefined value (backward compatibility)", () => {
      const result = fromPrismaStorageProvider(undefined);
      expect(result).toBe(StorageProvider.OCI);
    });

    it("should return default storage provider for legacy projects", () => {
      const result = fromPrismaStorageProvider(null);
      expect(result).toBe(DEFAULT_STORAGE_PROVIDER);
    });

    it("should convert OCI Prisma enum to StorageProvider.OCI", () => {
      const result = fromPrismaStorageProvider("OCI");
      expect(result).toBe(StorageProvider.OCI);
    });

    it("should convert R2 Prisma enum to StorageProvider.R2", () => {
      const result = fromPrismaStorageProvider("R2");
      expect(result).toBe(StorageProvider.R2);
    });
  });

  describe("toPrismaStorageProvider", () => {
    it("should return OCI for null value", () => {
      const result = toPrismaStorageProvider(null);
      expect(result).toBe("OCI");
    });

    it("should return OCI for undefined value", () => {
      const result = toPrismaStorageProvider(undefined);
      expect(result).toBe("OCI");
    });

    it("should convert StorageProvider.OCI to OCI Prisma enum", () => {
      const result = toPrismaStorageProvider(StorageProvider.OCI);
      expect(result).toBe("OCI");
    });

    it("should convert StorageProvider.R2 to R2 Prisma enum", () => {
      const result = toPrismaStorageProvider(StorageProvider.R2);
      expect(result).toBe("R2");
    });
  });

  describe("isValidStorageProvider", () => {
    it("should return true for valid OCI provider", () => {
      expect(isValidStorageProvider("OCI")).toBe(true);
    });

    it("should return true for valid R2 provider", () => {
      expect(isValidStorageProvider("R2")).toBe(true);
    });

    it("should return false for invalid provider", () => {
      expect(isValidStorageProvider("INVALID")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isValidStorageProvider("")).toBe(false);
    });

    it("should return false for lowercase provider names", () => {
      expect(isValidStorageProvider("oci")).toBe(false);
      expect(isValidStorageProvider("r2")).toBe(false);
    });
  });

  describe("Round-trip conversion", () => {
    it("should preserve OCI through round-trip conversion", () => {
      const original = StorageProvider.OCI;
      const prisma = toPrismaStorageProvider(original);
      const result = fromPrismaStorageProvider(prisma);
      expect(result).toBe(original);
    });

    it("should preserve R2 through round-trip conversion", () => {
      const original = StorageProvider.R2;
      const prisma = toPrismaStorageProvider(original);
      const result = fromPrismaStorageProvider(prisma);
      expect(result).toBe(original);
    });
  });
});
