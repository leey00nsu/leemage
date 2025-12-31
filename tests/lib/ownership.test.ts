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

describe("Ownership Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("verifyProjectOwnership", () => {
    it("should return authorized when user owns the project", async () => {
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

    it("should return NOT_FOUND when project does not exist", async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const result = await verifyProjectOwnership("user-123", "nonexistent");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("should return NOT_FOUND when user does not own the project (no info disclosure)", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "other-user" });

      const result = await verifyProjectOwnership("user-123", "project-456");

      // Should return NOT_FOUND, not FORBIDDEN, to prevent info disclosure
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("should return NOT_FOUND when userId is empty", async () => {
      const result = await verifyProjectOwnership("", "project-456");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when projectId is empty", async () => {
      const result = await verifyProjectOwnership("user-123", "");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
      expect(mockPrisma.project.findUnique).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      mockPrisma.project.findUnique.mockRejectedValue(new Error("DB error"));

      const result = await verifyProjectOwnership("user-123", "project-456");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  describe("verifyFileOwnership", () => {
    it("should return authorized when user owns the file through project", async () => {
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

    it("should return NOT_FOUND when file does not exist", async () => {
      mockPrisma.file.findUnique.mockResolvedValue(null);

      const result = await verifyFileOwnership("user-123", "nonexistent");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("should return NOT_FOUND when user does not own the file", async () => {
      mockPrisma.file.findUnique.mockResolvedValue({
        project: { userId: "other-user" },
      });

      const result = await verifyFileOwnership("user-123", "file-789");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("should return NOT_FOUND when fileId is empty", async () => {
      const result = await verifyFileOwnership("user-123", "");

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  describe("verifyFileOwnershipWithProject", () => {
    it("should return authorized when user owns project and file belongs to it", async () => {
      const userId = "user-123";
      const fileId = "file-789";
      const projectId = "project-456";

      mockPrisma.project.findUnique.mockResolvedValue({ userId });
      mockPrisma.file.findUnique.mockResolvedValue({ projectId });

      const result = await verifyFileOwnershipWithProject(userId, fileId, projectId);

      expect(result.authorized).toBe(true);
    });

    it("should return NOT_FOUND when user does not own the project", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "other-user" });

      const result = await verifyFileOwnershipWithProject(
        "user-123",
        "file-789",
        "project-456"
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });

    it("should return NOT_FOUND when file does not belong to the project", async () => {
      mockPrisma.project.findUnique.mockResolvedValue({ userId: "user-123" });
      mockPrisma.file.findUnique.mockResolvedValue({ projectId: "other-project" });

      const result = await verifyFileOwnershipWithProject(
        "user-123",
        "file-789",
        "project-456"
      );

      expect(result.authorized).toBe(false);
      expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
    });
  });

  /**
   * Property 4: Ownership Verification Completeness
   * For any file access request, the Resource_Owner_Checker SHALL verify
   * that the file's project belongs to the requesting user before allowing access.
   */
  describe("Property 4: Ownership Verification Completeness", () => {
    it("should always verify project ownership for file access", () => {
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
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should never authorize access when file does not exist", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // fileId
          async (userId, fileId) => {
            mockPrisma.file.findUnique.mockResolvedValue(null);

            const result = await verifyFileOwnership(userId, fileId);

            expect(result.authorized).toBe(false);
            expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should never authorize access when project does not exist", () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }), // userId
          fc.string({ minLength: 1, maxLength: 50 }), // projectId
          async (userId, projectId) => {
            mockPrisma.project.findUnique.mockResolvedValue(null);

            const result = await verifyProjectOwnership(userId, projectId);

            expect(result.authorized).toBe(false);
            expect(result.reason).toBe(OWNERSHIP_ERROR_CODES.NOT_FOUND);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Information Disclosure Prevention (Requirement 3.5)", () => {
    it("should return same error for non-existent and unauthorized resources", () => {
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
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
