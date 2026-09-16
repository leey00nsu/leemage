import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSessionAuth } from "@/lib/auth/session-auth";
import { StorageProvider } from "@/lib/generated/prisma";
import { validateQuota } from "@/shared/lib/storage-quota-utils";
import { lockStorageQuota } from "@/lib/api/storage-quota";

// GET: 모든 quota 조회 (세션 기반 인증)
export const GET = withSessionAuth(async () => {
  try {
    const quotas = await prisma.storageQuota.findMany();

    return NextResponse.json({
      quotas: quotas.map((q) => ({
        provider: q.provider,
        quotaBytes: Number(q.quotaBytes),
      })),
    });
  } catch (error) {
    console.error("Failed to get storage quotas:", error);
    return NextResponse.json(
      { error: "Failed to get storage quotas" },
      { status: 500 }
    );
  }
});

// PUT: quota 설정/업데이트 (세션 기반 인증)
export const PUT = withSessionAuth(async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { provider, quotaBytes } = body;

    // Validate provider
    if (!provider || !["OCI", "R2"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be OCI or R2." },
        { status: 400 }
      );
    }

    // Validate quotaBytes
    if (!validateQuota(quotaBytes)) {
      return NextResponse.json(
        { error: "Invalid quota. Must be a positive number." },
        { status: 400 }
      );
    }

    // Upsert quota (round to integer for BigInt)
    const quotaBytesInt = Math.round(quotaBytes);
    const storageProvider = provider as StorageProvider;
    const quota = await prisma.$transaction(async (tx) => {
      await lockStorageQuota(tx, storageProvider);
      return tx.storageQuota.upsert({
        where: { provider: storageProvider },
        update: { quotaBytes: BigInt(quotaBytesInt) },
        create: {
          provider: storageProvider,
          quotaBytes: BigInt(quotaBytesInt),
        },
      });
    });

    return NextResponse.json({
      provider: quota.provider,
      quotaBytes: Number(quota.quotaBytes),
    });
  } catch (error) {
    console.error("Failed to set storage quota:", error);
    return NextResponse.json(
      { error: "Failed to set storage quota" },
      { status: 500 }
    );
  }
});

// DELETE: quota 삭제 (세션 기반 인증)
export const DELETE = withSessionAuth(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider || !["OCI", "R2"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be OCI or R2." },
        { status: 400 }
      );
    }

    const storageProvider = provider as StorageProvider;
    await prisma.$transaction(async (tx) => {
      await lockStorageQuota(tx, storageProvider);
      await tx.storageQuota.delete({ where: { provider: storageProvider } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete storage quota:", error);
    return NextResponse.json(
      { error: "Failed to delete storage quota" },
      { status: 500 }
    );
  }
});
