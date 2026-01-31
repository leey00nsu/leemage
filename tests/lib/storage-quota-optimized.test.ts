import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateStorageUsage,
  getStorageUsage,
  invalidateStorageCache,
  invalidateAllStorageCaches,
  checkStorageQuotaOptimized,
} from "@/lib/api/storage-quota";
import { StorageProvider } from "@/lib/generated/prisma";

// Prisma 목업
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

describe("스토리지 쿼터 최적화", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateAllStorageCaches();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("calculateStorageUsage", () => {
    it("데이터베이스 집계를 사용하여 계산해야 한다", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1024000 },
        _count: { id: 10 },
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      expect(result.totalBytes).toBe(1024000);
      expect(result.fileCount).toBe(10);
      expect(result.lastCalculated).toBeInstanceOf(Date);

      // 올바른 파라미터로 집계가 호출되었는지 확인
      expect(mockPrisma.file.aggregate).toHaveBeenCalledWith({
        where: {
          project: { storageProvider: StorageProvider.OCI },
          status: "COMPLETED",
        },
        _sum: { size: true },
        _count: { id: true },
      });
    });

    it("빈 결과를 처리해야 한다", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: null },
        _count: { id: 0 },
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      expect(result.totalBytes).toBe(0);
      expect(result.fileCount).toBe(0);
    });
  });

  describe("속성 10: 스토리지 집계 효율성", () => {
    it("사용량 계산 시 정확히 한 번의 데이터베이스를 호출해야 한다", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 5000000 },
        _count: { id: 50 },
      });

      await calculateStorageUsage(StorageProvider.OCI);

      // findMany가 아닌 aggregate만 한 번 호출되어야 함
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);
    });

    it("파일 수와 관계없이 집계를 사용해야 한다", async () => {
      // 대량의 파일 시뮬레이션
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 100000000000 }, // 100GB
        _count: { id: 100000 }, // 100k files
      });

      const result = await calculateStorageUsage(StorageProvider.OCI);

      // 여전히 한 번만 호출되어야 함
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);
      expect(result.totalBytes).toBe(100000000000);
      expect(result.fileCount).toBe(100000);
    });
  });

  describe("getStorageUsage (캐싱)", () => {
    it("결과를 캐싱해야 한다", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1024000 },
        _count: { id: 10 },
      });

      // 첫 번째 호출 - 데이터베이스 조회
      const result1 = await getStorageUsage(StorageProvider.OCI);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1);

      // 두 번째 호출 - 캐시 사용
      const result2 = await getStorageUsage(StorageProvider.OCI);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(1); // 여전히 1

      expect(result1.totalBytes).toBe(result2.totalBytes);
    });

    it("무효화 후 캐시를 갱신해야 한다", async () => {
      mockPrisma.file.aggregate
        .mockResolvedValueOnce({
          _sum: { size: 1000 },
          _count: { id: 1 },
        })
        .mockResolvedValueOnce({
          _sum: { size: 2000 },
          _count: { id: 2 },
        });

      // 첫 번째 호출
      const result1 = await getStorageUsage(StorageProvider.OCI);
      expect(result1.totalBytes).toBe(1000);

      // 캐시 무효화
      invalidateStorageCache(StorageProvider.OCI);

      // 두 번째 호출 - 다시 데이터베이스 조회
      const result2 = await getStorageUsage(StorageProvider.OCI);
      expect(result2.totalBytes).toBe(2000);
      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(2);
    });
  });

  describe("checkStorageQuotaOptimized", () => {
    it("쿼터 미설정 시 업로드를 허용해야 한다", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue(null);

      const result = await checkStorageQuotaOptimized(
        StorageProvider.OCI,
        1000000,
      );

      expect(result.allowed).toBe(true);
    });

    it("쿼터가 0일 때 업로드를 허용해야 한다", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(0),
      });

      const result = await checkStorageQuotaOptimized(
        StorageProvider.OCI,
        1000000,
      );

      expect(result.allowed).toBe(true);
    });

    it("쿼터 내 업로드를 허용해야 한다", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(10000000), // 10MB
      });
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 5000000 }, // 5MB used
        _count: { id: 5 },
      });

      const result = await checkStorageQuotaOptimized(
        StorageProvider.OCI,
        1000000,
      ); // 1MB upload

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5000000);
    });

    it("쿼터 초과 시 업로드를 거부해야 한다", async () => {
      mockPrisma.storageQuota.findUnique.mockResolvedValue({
        provider: StorageProvider.OCI,
        quotaBytes: BigInt(10000000), // 10MB
      });
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 9500000 }, // 9.5MB used
        _count: { id: 10 },
      });

      const result = await checkStorageQuotaOptimized(
        StorageProvider.OCI,
        1000000,
      ); // 1MB upload

      expect(result.allowed).toBe(false);
      expect(result.message).toContain("스토리지 한도를 초과합니다");
      expect(result.remaining).toBe(500000);
    });
  });

  describe("invalidateAllStorageCaches", () => {
    it("모든 프로바이더 캐시를 삭제해야 한다", async () => {
      mockPrisma.file.aggregate.mockResolvedValue({
        _sum: { size: 1000 },
        _count: { id: 1 },
      });

      // 여러 프로바이더의 캐시 채우기
      await getStorageUsage(StorageProvider.OCI);
      await getStorageUsage(StorageProvider.R2);

      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(2);

      // 모든 캐시 삭제
      invalidateAllStorageCaches();

      // 둘 다 다시 데이터베이스 조회해야 함
      await getStorageUsage(StorageProvider.OCI);
      await getStorageUsage(StorageProvider.R2);

      expect(mockPrisma.file.aggregate).toHaveBeenCalledTimes(4);
    });
  });
});
