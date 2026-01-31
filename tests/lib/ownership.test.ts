import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import {
  verifyProjectOwnership,
  verifyFileOwnership,
  verifyFileOwnershipWithProject,
  OWNERSHIP_ERROR_CODES,
} from "@/lib/auth/ownership";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: vi.fn(),
    },
    file: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  project: { findUnique: ReturnType<typeof vi.fn> };
  file: { findUnique: ReturnType<typeof vi.fn> };
};

describe("소유권 검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyProjectOwnership", () => {
    it("사용자가 프로젝트를 소유한 경우 승인을 반환해야 한다", async () => {
      const userId = "user-123";
      const projectId = "project-456";

      mockPrisma.project.findUnique.mockResolvedValue({ userId });

      const result = await verifyProjectOwnership(userId, projectId);

      expect(result.authorized).toBe(true);
      expect(result.reason).toBeUndefined();
      expect(mockPrisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: projectId },
        select: { userId: true },
      });
    });

    it("프로젝트가 존재하지 않는 경우 NOT_FOUND를 반환해야 한다", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await verifyProjectOwnership("user-123", "nonexistent");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("사용자가 프로젝트를 소유하지 않은 경우 NOT_FOUND를 반환해야 한다 (정보 유출 방지)", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "other-user" });

      const result = await verifyProjectOwnership("user-123", "project-456");

      // Should return NOT_FOUND, not FORBIDDEN, to prevent info disclosure
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("userId가 비어있는 경우 NOT_FOUND를 반환해야 한다", async () => {
      const result = await verifyProjectOwnership("", "project-456");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it("projectId가 비어있는 경우 NOT_FOUND를 반환해야 한다", async () => {
      const result = await verifyProjectOwnership("user-123", "");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it("데이터베이스 오류를 적절히 처리해야 한다", async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error("DB error"));

      const result = await verifyProjectOwnership("user-123", "project-456");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  describe("verifyFileOwnership", () => {
    it("사용자가 프로젝트를 통해 파일을 소유한 경우 승인을 반환해야 한다", async () => {
      const userId = "user-123";
      const fileId = "file-789";

      mockPrisma.file.findUnique.mockResolvedValue({
        project: { userId },
      });

      const result = await verifyFileOwnership(userId, fileId);

      expect(result.authorized).toBe(true);
      expect(mockPrisma.file.findUnique).toHaveBeenCalledWith({
        where: { id: fileId },
        select: { project: { select: { userId: true } } },
      });
    });

    it("파일이 존재하지 않는 경우 NOT_FOUND를 반환해야 한다", async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      const result = await verifyFileOwnership("user-123", "nonexistent");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("사용자가 파일을 소유하지 않은 경우 NOT_FOUND를 반환해야 한다", async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        project: { userId: "other-user" },
      });

      const result = await verifyFileOwnership("user-123", "file-789");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("fileId가 비어있는 경우 NOT_FOUND를 반환해야 한다", async () => {
      const result = await verifyFileOwnership("user-123", "");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  describe("verifyFileOwnershipWithProject", () => {
    it("사용자가 프로젝트를 소유하고 파일이 해당 프로젝트에 속한 경우 승인을 반환해야 한다", async () => {
      const userId = "user-123";
      const fileId = "file-789";
      const projectId = "project-456";

      mockPrisma.project.findUnique.mockResolvedValue({ userId });
      mockPrisma.file.findUnique.mockResolvedValue({ projectId });

      const result = await verifyFileOwnershipWithProject(
        userId,
        fileId,
        projectId,
      );

      expect(result.authorized).toBe(true);
    });

    it("사용자가 프로젝트를 소유하지 않은 경우 NOT_FOUND를 반환해야 한다", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "other-user" });

      const result = await verifyFileOwnershipWithProject(
        "user-123",
        "file-789",
        "project-456",
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("파일이 해당 프로젝트에 속하지 않은 경우 NOT_FOUND를 반환해야 한다", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "user-123" });
      mockPrisma.file.findUnique.mockResolvedValue({
        projectId: "other-project",
      });

      const result = await verifyFileOwnershipWithProject(
        "user-123",
        "file-789",
        "project-456",
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  describe("속성 4: 소유권 검증 완전성", () => {
    it("파일 접근 시 항상 프로젝트 소유권을 검증해야 한다", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // fileId
          fc.string({ minLength: 1, maxLength: 50 }), // projectUserId (owner)
          async (userId, fileId, projectUserId) => {
            // Reset mocks for each iteration
            mockPrisma.file.findUnique.mockResolvedValue({
              project: { userId: projectUserId },
            });

            const result = await verifyFileOwnership(userId, fileId);

            // Authorization should only be granted if userId matches projectUserId
            if (userId === projectUserId) {
              expect(result.authorized).toBe(true);
            } else {
              expect(result.authorized).toBe(false);
              expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("파일이 존재하지 않을 때 절대 접근을 허용하지 않아야 한다", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // fileId
          async (userId, fileId) => {
            mockPrisma.file.findUnique.mockResolvedValue(null);

            const result = await verifyFileOwnership(userId, fileId);

            expect(result.authorized).toBe(false);
            expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("프로젝트가 존재하지 않을 때 절대 접근을 허용하지 않아야 한다", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // projectId
          async (userId, projectId) => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            const result = await verifyProjectOwnership(userId, projectId);

            expect(result.authorized).toBe(false);
            expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("정보 유출 방지 (요구사항 3.5)", () => {
    it("존재하지 않는 리소스와 권한 없는 리소스에 대해 동일한 오류를 반환해야 한다", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // projectId
          fc.boolean(), // exists
          async (userId, projectId, exists) => {
            if (exists) {
              // Project exists but owned by different user
              mockPrisma.project.findUnique.mockResolvedValue({
                userId: `different-${userId}`,
              });
            } else {
              // Project does not exist
              mockPrisma.project.findUnique.mockResolvedValue(null);
            }

            const result = await verifyProjectOwnership(userId, projectId);

            // Both cases should return the same error to prevent info disclosure
            expect(result.authorized).toBe(false);
            expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
