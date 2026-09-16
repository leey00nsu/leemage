import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth/validate-api-key";
import { hashApiKey } from "@/lib/auth/api-key-auth/hash";

const mocks = vi.hoisted(() => ({
  compare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: mocks.compare,
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
    updateMany: ReturnType<typeof vi.fn>;
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
        lastUsedAt: true,
      },
    });
  });

  it("SHA-256 키를 bcrypt 없이 검증하고 최근 사용 시각 쓰기를 생략한다", async () => {
    const providedApiKey =
      "lmk_1234567890abcdef1234567890abcdef1234567890abcdef";
    mockPrisma.apiKey.findMany.mockResolvedValue([
      {
        id: "key-id",
        keyHash: hashApiKey(providedApiKey),
        userIdentifier: "owner@example.com",
        name: "deploy",
        prefix: providedApiKey.slice(0, 20),
        permissions: ["read"],
        lastUsedAt: new Date(),
      },
    ]);

    const result = await validateApiKey(
      new NextRequest("http://localhost/api/v1/projects", {
        headers: { Authorization: `Bearer ${providedApiKey}` },
      }),
    );

    expect(result).toMatchObject({ id: "key-id", permissions: ["read"] });
    expect(mocks.compare).not.toHaveBeenCalled();
    expect(mockPrisma.apiKey.updateMany).not.toHaveBeenCalled();
  });

  it("기존 bcrypt 키를 검증한 뒤 SHA-256 형식으로 마이그레이션한다", async () => {
    const providedApiKey =
      "lmk_1234567890abcdef1234567890abcdef1234567890abcdef";
    mocks.compare.mockResolvedValue(true);
    mockPrisma.apiKey.findMany.mockResolvedValue([
      {
        id: "legacy-id",
        keyHash: "$2b$10$legacy",
        userIdentifier: "owner@example.com",
        name: null,
        prefix: "lmk_",
        permissions: ["read", "write", "delete"],
        lastUsedAt: null,
      },
    ]);

    const result = await validateApiKey(
      new NextRequest("http://localhost/api/v1/projects", {
        headers: { Authorization: `Bearer ${providedApiKey}` },
      }),
    );

    expect(result?.id).toBe("legacy-id");
    expect(mockPrisma.apiKey.updateMany).toHaveBeenCalledWith({
      where: { id: "legacy-id", keyHash: "$2b$10$legacy" },
      data: {
        lastUsedAt: expect.any(Date),
        keyHash: hashApiKey(providedApiKey),
      },
    });
  });
});
