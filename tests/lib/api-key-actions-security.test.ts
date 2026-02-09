import { beforeEach, describe, expect, it, vi } from "vitest";
import { getApiKeyInfo } from "@/features/api-key/api/get";
import { deleteApiKey } from "@/features/api-key/api/delete";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth/session-auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";

const mockPrisma = prisma as unknown as {
  apiKey: {
    findFirst: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
  };
};

const mockGetCurrentUser = vi.mocked(getCurrentUser);

describe("API 키 서버 액션 보안", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getApiKeyInfo", () => {
    it("인증되지 않은 경우 null을 반환해야 한다", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      const result = await getApiKeyInfo();

      expect(result).toBeNull();
      expect(mockPrisma.apiKey.findFirst).not.toHaveBeenCalled();
    });

    it("현재 사용자 범위로만 prefix를 조회해야 한다", async () => {
      mockGetCurrentUser.mockResolvedValue("user@example.com");
      mockPrisma.apiKey.findFirst.mockResolvedValue({ prefix: "lmk_abc" });

      const result = await getApiKeyInfo();

      expect(result).toEqual({ prefix: "lmk_abc" });
      expect(mockPrisma.apiKey.findFirst).toHaveBeenCalledWith({
        where: { userIdentifier: "user@example.com" },
        orderBy: { createdAt: "desc" },
        select: { prefix: true },
      });
    });
  });

  describe("deleteApiKey", () => {
    it("인증되지 않은 경우 오류를 발생시켜야 한다", async () => {
      mockGetCurrentUser.mockResolvedValue(null);

      await expect(deleteApiKey()).rejects.toThrow("인증이 필요합니다.");
      expect(mockPrisma.apiKey.deleteMany).not.toHaveBeenCalled();
    });

    it("현재 사용자 키만 삭제해야 한다", async () => {
      mockGetCurrentUser.mockResolvedValue("user@example.com");
      mockPrisma.apiKey.deleteMany.mockResolvedValue({ count: 2 });

      await deleteApiKey();

      expect(mockPrisma.apiKey.deleteMany).toHaveBeenCalledWith({
        where: { userIdentifier: "user@example.com" },
      });
    });
  });
});
