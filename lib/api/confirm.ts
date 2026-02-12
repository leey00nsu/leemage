import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import {
  validateFileName,
  validateContentTypeExtension,
} from "@/lib/validation/file-validator";
import { isImageMimeType, isVideoMimeType } from "@/shared/lib/file-utils";
import { confirmRequestSchema } from "@/lib/openapi/schemas/files";
import { handleImageConfirm } from "@/lib/api/confirm/image-workflow";
import { handleVideoConfirm } from "@/lib/api/confirm/video-workflow";
import { handleOtherConfirm } from "@/lib/api/confirm/other-workflow";

export type {
  ConfirmRequest,
  ImageVariantData,
  VariantOption,
} from "@/lib/api/confirm/types";

async function authorizeProjectAccess(
  userId: string,
  projectId: string,
): Promise<NextResponse | null> {
  const ownershipResult = await verifyProjectOwnership(userId, projectId);
  if (!ownershipResult.authorized) {
    return NextResponse.json(
      { message: "Resource not found." },
      { status: 404 },
    );
  }

  return null;
}

async function getProjectStorageProvider(
  projectId: string,
): Promise<{ storageProvider: ReturnType<typeof fromPrismaStorageProvider> } | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { storageProvider: true },
  });

  if (!project) {
    return null;
  }

  return { storageProvider: fromPrismaStorageProvider(project.storageProvider) };
}

async function validateConfirmPayload(request: NextRequest) {
  const body = await request.json();
  const parseResult = confirmRequestSchema.safeParse(body);

  if (!parseResult.success) {
    return {
      error: NextResponse.json(
        {
          message: "Invalid request format.",
          errors: parseResult.error.flatten(),
        },
        { status: 400 },
      ),
      data: null,
    };
  }

  return {
    error: null,
    data: parseResult.data,
  };
}

function validateFileInput(fileName: string, contentType: string): NextResponse | null {
  const fileNameValidation = validateFileName(fileName);
  if (!fileNameValidation.valid) {
    return NextResponse.json(
      {
        message: fileNameValidation.errors[0] || "Invalid file name.",
      },
      { status: 400 },
    );
  }

  if (!validateContentTypeExtension(contentType, fileName)) {
    return NextResponse.json(
      { message: "File type does not match the extension." },
      { status: 400 },
    );
  }

  return null;
}

async function ensurePendingFile(fileId: string, projectId: string) {
  const pendingFile = await prisma.file.findFirst({
    where: {
      id: fileId,
      projectId,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (!pendingFile) {
    return NextResponse.json(
      { message: "Invalid file ID or file already processed." },
      { status: 400 },
    );
  }

  return null;
}

/**
 * 업로드 완료 확인 핸들러
 * 클라이언트가 스토리지에 직접 업로드한 후 호출하여 pending 레코드를 completed로 업데이트합니다.
 */
export async function confirmHandler(
  request: NextRequest,
  projectId: string,
  userId: string,
): Promise<NextResponse> {
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID is required." },
      { status: 400 },
    );
  }

  const unauthorizedResponse = await authorizeProjectAccess(userId, projectId);
  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const project = await getProjectStorageProvider(projectId);
    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 },
      );
    }

    const payload = await validateConfirmPayload(request);
    if (payload.error || !payload.data) {
      return payload.error as NextResponse;
    }

    const { fileId, objectName, fileName, contentType, fileSize, variants } = payload.data;

    const invalidInputResponse = validateFileInput(fileName, contentType);
    if (invalidInputResponse) {
      return invalidInputResponse;
    }

    const pendingFileResponse = await ensurePendingFile(fileId, projectId);
    if (pendingFileResponse) {
      return pendingFileResponse;
    }

    const storageAdapter = await StorageFactory.getAdapter(project.storageProvider);

    if (isImageMimeType(contentType) && variants && variants.length > 0) {
      return handleImageConfirm({
        projectId,
        fileId,
        objectName,
        fileName,
        contentType,
        fileSize,
        variants,
        storageAdapter,
      });
    }

    if (isVideoMimeType(contentType)) {
      return handleVideoConfirm({
        projectId,
        fileId,
        objectName,
        fileName,
        contentType,
        fileSize,
        storageAdapter,
      });
    }

    return handleOtherConfirm({
      fileId,
      objectName,
      fileName,
      contentType,
      fileSize,
      storageAdapter,
    });
  } catch (error) {
    console.error("Confirm API error:", error);

    if (error instanceof Error && error.message.toLowerCase().includes("download")) {
      return NextResponse.json(
        { message: "Uploaded file not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { message: "An error occurred while processing the file." },
      { status: 500 },
    );
  }
}
