"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";

export interface ApiKeyListItem {
  id: string;
  name: string | null;
  prefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  return prisma.apiKey.findMany({
    where: { userIdentifier },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });
}
