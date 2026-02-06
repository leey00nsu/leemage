"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session-auth";
import type { ApiKeyPermission } from "@/shared/config/api-key-permissions";

export interface ApiKeyListItem {
  id: string;
  name: string | null;
  prefix: string;
  permissions: ApiKeyPermission[];
  createdAt: Date;
  lastUsedAt: Date | null;
}

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
  const userIdentifier = await getCurrentUser();
  if (!userIdentifier) {
    throw new Error("인증이 필요합니다.");
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userIdentifier },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      prefix: true,
      permissions: true,
      createdAt: true,
      lastUsedAt: true,
    },
  });

  return apiKeys.map((apiKey) => ({
    ...apiKey,
    permissions: apiKey.permissions as ApiKeyPermission[],
  }));
}
