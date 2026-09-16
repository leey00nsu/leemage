import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  usage: vi.fn(),
  quotas: vi.fn(),
}));
vi.mock("@/lib/auth/session-auth", () => ({
  withSessionAuth: (handler: unknown) => handler,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: mocks.usage,
    storageQuota: { findMany: mocks.quotas },
  },
}));

import { GET } from "@/app/api/storage/usage/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.usage.mockResolvedValue([
    {
      provider: "R2",
      bytes: BigInt(150),
      projects: BigInt(2),
      files: BigInt(3),
    },
  ]);
  mocks.quotas.mockResolvedValue([
    { provider: "R2", quotaBytes: BigInt(300) },
  ]);
});

it("returns database-side storage aggregates", async () => {
  const request = Object.assign(
    new NextRequest("http://localhost/api/storage/usage"),
    { session: { username: "owner" } },
  );
  const response = await GET(request, { params: Promise.resolve({}) });

  expect(mocks.usage).toHaveBeenCalledTimes(1);
  expect(await response.json()).toEqual({
    providers: [
      {
        provider: "R2",
        bytes: 150,
        projects: 2,
        files: 3,
        quota: 300,
        percentage: 50,
        status: "normal",
      },
    ],
    total: { bytes: 150, projects: 2, files: 3 },
  });
});
