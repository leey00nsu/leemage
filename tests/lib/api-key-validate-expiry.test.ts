import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock("@/lib/logging/secure-logger", () => ({
  authLogger: {
    security: vi.fn(),
    error: vi.fn(),
  },
  maskApiKey: vi.fn(() => "lmk_****"),
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as unknown as {
  apiKey: {
    findMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

describe("API 키 만료 보안 검증", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("만료되지 않은 키만 조회하도록 expiresAt 필터를 적용해야 한다", async () => {
    const providedApiKey = "lmk_1234567890abcdef1234567890abcdef1234567890abcdef";
    const request = new NextRequest("http://localhost/api/v1/projects", {
      headers: {
        Authorization: `Bearer ${providedApiKey}`,
        "x-forwarded-for": "127.0.0.1",
      },
    });

    mockPrisma.apiKey.findMany.mockResolvedValue([]);

    const result = await validateApiKey(request);

    expect(result).toBeNull();
    expect(mockPrisma.apiKey.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.apiKey.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { prefix: providedApiKey.slice(0, 20) },
          { prefix: "lmk_" },
        ],
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: expect.any(Date) } },
            ],
          },
        ],
      },
      select: {
        id: true,
        keyHash: true,
        userIdentifier: true,
        name: true,
        prefix: true,
        permissions: true,
      },
    });
  });
});
