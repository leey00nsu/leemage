import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateStorageUsage,
  getStorageUsage,
  invalidateStorageCache,
  invalidateAllStorageCaches,
  checkStorageQuotaOptimized,
} from "@/lib/api/storage-quota";
import { StorageProvider } from "@/lib/generated/prisma";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    file: {
      aggregate: vi.fn(),
    },
    storageQuota: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  file: { aggregate: ReturnType<typeof vi.fn> };
  storageQuota: { findUnique: ReturnType<typeof vi.fn> };
};

describe("Storage Quota Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateAllStorageCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateStorageUsage", () => {
    it("should use database aggregation for calculation", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1024000 },
        _count: { id: 10 },
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      expect(result.totalBytes).toBe(1024000);
      expect(result.fileCount).toBe(10);
      expect(result.lastCalculated).toBeInstanceOf(Date);

      // Verify aggregation was called with correct parameters
      expect(mockPrisma.file.aggregate).toHaveBeenCalledWith({
        where: {
          project: { storageProvider: StorageProvider.OCI },
          status: "COMPLETED",
        },
        _sum: { size: true },
        _count: { id: true },
      });
    });

    it("should handle empty results", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: null },
        _count: { id: 0 },
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      expect(result.totalBytes).toBe(0);
      expect(result.fileCount).toBe(0);
    });
  });

  /**
   * Property 10: Storage Aggregation Efficiency
   * For any storage usage calculation, the query SHALL use a single
   * database aggregation query instead of loading individual file records.
   */
  describe("Property 10: Storage Aggregation Efficiency", () => {
    it("should make exactly one database call for usage calculation", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 5000000 },
        _count: { id: 50 },
      });

      await calculateStorageUsage(StorageProvider.OCI);

      // Should only call aggregate once, not findMany
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);
    });

    it("should use aggregation regardless of file count", async () => {
      // Simulate large number of files
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 100000000000 }, // 100GB
        _count: { id: 100000 }, // 100k files
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      // Should still only make one call
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);
      expect(result.totalBytes).toBe(100000000000);
      expect(result.fileCount).toBe(100000);
    });
  });

  describe("getStorageUsage (caching)", () => {
    it("should cache results", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1024000 },
        _count: { id: 10 },
      });

      // First call - should hit database
      const result1 = await getStorageUsage(StorageProvider.OCI);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await getStorageUsage(StorageProvider.OCI);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1); // Still 1

      expect(result1.totalBytes).toBe(result2.totalBytes);
    });

    it("should refresh cache after invalidation", async () => {
      mockPrisma.file.aggregate
        .mockResolvedValueOnce({
          _sum: { size: 1000 },
          _count: { id: 1 },
        })
        .mockResolvedValueOnce({
          _sum: { size: 2000 },
          _count: { id: 2 },
        });

      // First call
      const result1 = await getStorageUsage(StorageProvider.OCI);
      expect(result1.totalBytes).toBe(1000);

      // Invalidate cache
      invalidateStorageCache(StorageProvider.OCI);

      // Second call - should hit database again
      const result2 = await getStorageUsage(StorageProvider.OCI);
      expect(result2.totalBytes).toBe(2000);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(2);
    });
  });

  describe("checkStorageQuotaOptimized", () => {
    it("should allow upload when no quota is set", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue(null);

      const result = await checkStorageQuotaOptimized(StorageProvider.OCI, 1000000);

      expect(result.allowed).toBe(true);
    });

    it("should allow upload when quota is zero", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(0),
      });

      const result = await checkStorageQuotaOptimized(StorageProvider.OCI, 1000000);

      expect(result.allowed).toBe(true);
    });

    it("should allow upload when within quota", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(10000000), // 10MB
      });
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 5000000 }, // 5MB used
        _count: { id: 5 },
      });

      const result = await checkStorageQuotaOptimized(StorageProvider.OCI, 1000000); // 1MB upload

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5000000);
    });

    it("should reject upload when quota would be exceeded", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(10000000), // 10MB
      });
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 9500000 }, // 9.5MB used
        _count: { id: 10 },
      });

      const result = await checkStorageQuotaOptimized(StorageProvider.OCI, 1000000); // 1MB upload

      expect(result.allowed).toBe(false);
      expect(result.message).toContain("스토리지 한도를 초과합니다");
      expect(result.remaining).toBe(500000);
    });
  });

  describe("invalidateAllStorageCaches", () => {
    it("should clear all provider caches", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1000 },
        _count: { id: 1 },
      });

      // Populate caches for multiple providers
      await getStorageUsage(StorageProvider.OCI);
      await getStorageUsage(StorageProvider.R2);

      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(2);

      // Clear all caches
      invalidateAllStorageCaches();

      // Both should hit database again
      await getStorageUsage(StorageProvider.OCI);
      await getStorageUsage(StorageProvider.R2);

      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(4);
    });
  });
});
