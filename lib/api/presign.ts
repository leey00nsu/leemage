import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import cuid from "cuid";
import { z } from "zod";
import {
  DEFAULT_MAX_FILE_SIZE,
  getFileExtension,
  isImageMimeType,
} from "@/shared/lib/file-utils";
import { presignRequestSchema } from "@/lib/openapi/schemas/files";
import { StorageProvider } from "@/lib/generated/prisma";
import { ImageVariantData } from "@/entities/files/model/types";

export type PresignRequest = z.infer<typeof presignRequestSchema>;

export interface PresignResponse {
  presignedUrl: string;
  objectName: string;
  objectUrl: string;
  fileId: string;
  expiresAt: string;
}

/**
 * Presigned URL 생성 핸들러
 * 클라이언트가 스토리지에 직접 업로드할 수 있는 Presigned URL을 생성합니다.
 * pending 상태의 DB 레코드를 먼저 생성하여 고아 오브젝트 문제를 방지합니다.
 */
export async function presignHandler(
  request: NextRequest,
  projectId: string
): Promise<
  NextResponse<PresignResponse | { message: string; errors?: unknown }>
> {
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 프로젝트 조회하여 스토리지 프로바이더 확인
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { storageProvider: true },
    });

    if (!project) {
      return NextResponse.json(
        { message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const body = await request.json();

    // 요청 검증
    const parseResult = presignRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: "잘못된 요청 형식입니다.",
          errors: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fileName, contentType, fileSize } = parseResult.data;

    // 파일 크기 검증
    if (fileSize > DEFAULT_MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "파일 크기가 제한(50MB)을 초과했습니다." },
        { status: 413 }
      );
    }

    // 스토리지 한도 체크
    const quotaCheckResult = await checkStorageQuota(
      project.storageProvider,
      fileSize
    );
    if (!quotaCheckResult.allowed) {
      return NextResponse.json(
        {
          message: quotaCheckResult.message,
          code: "QUOTA_EXCEEDED",
          remaining: quotaCheckResult.remaining,
        },
        { status: 413 }
      );
    }

    // 파일 ID 및 객체 이름 생성
    const fileId = cuid();
    const extension = getFileExtension(fileName) || "bin";
    const objectName = `${projectId}/${fileId}.${extension}`;
    const isImage = isImageMimeType(contentType);

    // 프로젝트의 스토리지 프로바이더에 맞는 어댑터 가져오기
    const storageProvider = fromPrismaStorageProvider(project.storageProvider);
    const storageAdapter = await StorageFactory.getAdapter(storageProvider);

    // Presigned URL 생성
    const parResult = await storageAdapter.createPresignedUploadUrl({
      objectName,
      contentType,
      expiresInMinutes: 15,
    });

    // pending 상태로 DB 레코드 생성 (고아 오브젝트 추적용)
    await prisma.file.create({
      data: {
        id: fileId,
        name: fileName,
        mimeType: contentType,
        isImage,
        size: fileSize,
        objectName,
        status: "PENDING",
        variants: [],
        projectId,
      },
    });

    const response: PresignResponse = {
      presignedUrl: parResult.presignedUrl,
      objectName,
      objectUrl: parResult.objectUrl,
      fileId,
      expiresAt: parResult.expiresAt.toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Presign API error:", error);
    return NextResponse.json(
      { message: "업로드 URL 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}


/**
 * 스토리지 한도 체크
 * @param provider - 스토리지 프로바이더
 * @param fileSize - 업로드할 파일 크기 (bytes)
 * @returns 업로드 허용 여부 및 메시지
 */
async function checkStorageQuota(
  provider: StorageProvider,
  fileSize: number
): Promise<{
  allowed: boolean;
  message: string;
  remaining?: number;
}> {
  // 해당 프로바이더의 한도 조회
  const quota = await prisma.storageQuota.findUnique({
    where: { provider },
  });

  // 한도가 설정되지 않은 경우 업로드 허용
  if (!quota || Number(quota.quotaBytes) === 0) {
    return { allowed: true, message: "" };
  }

  // 현재 사용량 계산 (원본 + variants 포함)
  const images = await prisma.file.findMany({
    where: {
      project: { storageProvider: provider },
      status: "COMPLETED",
    },
    select: { size: true, variants: true },
  });

  let currentUsage = 0;
  for (const img of images) {
    currentUsage += img.size; // 원본 크기
    const variants = img.variants as unknown as ImageVariantData[];
    if (Array.isArray(variants)) {
      currentUsage += variants.reduce((sum, v) => sum + (v.size || 0), 0);
    }
  }

  const quotaBytes = Number(quota.quotaBytes);
  const remaining = quotaBytes - currentUsage;

  // 업로드 후 한도 초과 여부 체크
  if (currentUsage + fileSize > quotaBytes) {
    return {
      allowed: false,
      message: `스토리지 한도를 초과합니다. 남은 용량: ${formatBytesSimple(remaining)}`,
      remaining,
    };
  }

  return { allowed: true, message: "", remaining };
}

/**
 * 바이트를 읽기 쉬운 형식으로 변환 (간단 버전)
 */
function formatBytesSimple(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(Math.max(1, bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
