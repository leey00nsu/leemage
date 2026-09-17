import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { withSessionAuth, AuthenticatedRequest } from "@/lib/auth/session-auth";
import {
  calculateUsagePercentage,
  getUsageStatus,
} from "@/shared/lib/storage-quota-utils";
import { variantBytesSql } from "@/lib/storage/variant-bytes-sql";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";

export interface StorageProviderUsage {
  provider: "OCI" | "R2";
  bytes: number;
  projects: number;
  files: number;
  quota?: number;
  percentage?: number;
  status: "normal" | "warning" | "critical" | "unknown";
}

export interface StorageUsageResponse {
  providers: StorageProviderUsage[];
  total: {
    bytes: number;
    projects: number;
    files: number;
  };
}

// GET 핸들러: 스토리지 사용량 조회 (세션 기반 인증)
export const GET = withSessionAuth(async (req: AuthenticatedRequest) => {
  try {
    const userId = req.session.username!;

    const usageRows = await prisma.$queryRaw<
      Array<{
        provider: "OCI" | "R2";
        bytes: bigint;
        projects: bigint;
        files: bigint;
      }>
    >(Prisma.sql`
      SELECT
        "Project"."storageProvider" AS provider,
        COUNT(DISTINCT "Project".id)::bigint AS projects,
        COUNT("File".id)::bigint AS files,
        COALESCE(SUM("File".size::bigint + ${variantBytesSql}), 0)::bigint AS bytes
      FROM "Project"
      LEFT JOIN "File"
        ON "File"."projectId" = "Project".id
        AND "File".status = 'COMPLETED'
      WHERE "Project"."userId" = ${userId}
      GROUP BY "Project"."storageProvider"
    `);

    // quota 정보 조회
    const quotas = await prisma.storageQuota.findMany();
    const quotaMap = new Map(
      quotas.map((q) => [q.provider, Number(q.quotaBytes)])
    );

    // quota 및 percentage 추가
    const providers: StorageProviderUsage[] = usageRows.map((row) => {
        const bytes = Number(row.bytes);
        const quota = quotaMap.get(row.provider);
        const percentage = calculateUsagePercentage(bytes, quota);
        const status = getUsageStatus(percentage);
        return {
          provider: row.provider,
          bytes,
          projects: Number(row.projects),
          files: Number(row.files),
          quota,
          percentage,
          status,
        };
      });

    // 전체 합계 계산
    const total = providers.reduce(
      (acc, p) => ({
        bytes: acc.bytes + p.bytes,
        projects: acc.projects + p.projects,
        files: acc.files + p.files,
      }),
      { bytes: 0, projects: 0, files: 0 }
    );

    const response: StorageUsageResponse = {
      providers,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    apiLogger.error("storage.usage.failed", getSafeErrorMetadata(error));
    return NextResponse.json(
      { error: "Failed to get storage usage" },
      { status: 500 }
    );
  }
});
