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
    await prisma.image.create({
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
