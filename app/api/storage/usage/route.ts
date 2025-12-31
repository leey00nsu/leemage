import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSessionAuth } from "@/lib/auth/session-auth";
import {
  calculateUsagePercentage,
  getUsageStatus,
} from "@/shared/lib/storage-quota-utils";
import { ImageVariantData } from "@/entities/files/model/types";

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
export const GET = withSessionAuth(async () => {
  try {
    // 프로바이더별 프로젝트와 파일 정보 조회
    const projects = await prisma.project.findMany({
      select: {
        storageProvider: true,
        files: {
          select: { size: true, variants: true },
          where: { status: "COMPLETED" },
        },
      },
    });

    // quota 정보 조회
    const quotas = await prisma.storageQuota.findMany();
    const quotaMap = new Map(
      quotas.map((q) => [q.provider, Number(q.quotaBytes)])
    );

    // 프로바이더별 집계
    const usageMap = new Map<string, Omit<StorageProviderUsage, "quota" | "percentage" | "status">>();

    for (const project of projects) {
      const provider = project.storageProvider as "OCI" | "R2";
      const existing = usageMap.get(provider) || {
        provider,
        bytes: 0,
        projects: 0,
        files: 0,
      };

      existing.projects += 1;
      existing.files += project.files.length;

      // 원본 파일 크기 + variants 크기 합산
      for (const file of project.files) {
        existing.bytes += file.size; // 원본 크기
        const variants = file.variants as unknown as ImageVariantData[];
        if (Array.isArray(variants)) {
          existing.bytes += variants.reduce((sum, v) => sum + (v.size || 0), 0);
        }
      }

      usageMap.set(provider, existing);
    }

    // quota 및 percentage 추가
    const providers: StorageProviderUsage[] = Array.from(usageMap.values()).map(
      (usage) => {
        const quota = quotaMap.get(usage.provider);
        const percentage = calculateUsagePercentage(usage.bytes, quota);
        const status = getUsageStatus(percentage);
        return {
          ...usage,
          quota,
          percentage,
          status,
        };
      }
    );

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
    console.error("Failed to get storage usage:", error);
    return NextResponse.json(
      { error: "Failed to get storage usage" },
      { status: 500 }
    );
  }
});
