import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: vi.fn(),
  count: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    apiKey: { count: mocks.count, create: mocks.create },
  },
}));
vi.mock("@/lib/auth/session-auth", () => ({
  getCurrentUser: mocks.currentUser,
}));

import { generateApiKey } from "@/features/api-key/api/generate";
import { hashApiKey } from "@/lib/auth/api-key-auth/hash";

describe("API key generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser.mockResolvedValue("owner@example.com");
    mocks.count.mockResolvedValue(0);
    mocks.create.mockResolvedValue({});
  });

  it("stores a fast one-way digest instead of a bcrypt password hash", async () => {
    const apiKey = await generateApiKey({ name: "deploy" });

    expect(apiKey).toMatch(/^lmk_[a-f0-9]{48}$/);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        prefix: apiKey.slice(0, 20),
        keyHash: hashApiKey(apiKey),
        userIdentifier: "owner@example.com",
        name: "deploy",
      }),
    });
  });
});
