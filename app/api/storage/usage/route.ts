import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionDefault } from "@/lib/session";

export interface StorageProviderUsage {
  provider: "OCI" | "R2";
  bytes: number;
  projects: number;
  files: number;
}

export interface StorageUsageResponse {
  providers: StorageProviderUsage[];
  total: {
    bytes: number;
    projects: number;
    files: number;
  };
}

// GET 핸들러: 스토리지 사용량 조회
export async function GET() {
  try {
    // 세션 확인
    const session = await getSessionDefault();
    if (!session.isLoggedIn) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 프로바이더별 프로젝트와 파일 정보 조회
    const projects = await prisma.project.findMany({
      select: {
        storageProvider: true,
        images: {
          select: { size: true },
          where: { status: "COMPLETED" },
        },
      },
    });

    // 프로바이더별 집계
    const usageMap = new Map<string, StorageProviderUsage>();

    for (const project of projects) {
      const provider = project.storageProvider as "OCI" | "R2";
      const existing = usageMap.get(provider) || {
        provider,
        bytes: 0,
        projects: 0,
        files: 0,
      };

      existing.projects += 1;
      existing.files += project.images.length;
      existing.bytes += project.images.reduce((sum, img) => sum + img.size, 0);

      usageMap.set(provider, existing);
    }

    const providers = Array.from(usageMap.values());

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
}
