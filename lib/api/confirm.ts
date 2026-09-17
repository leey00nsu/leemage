import { NextRequest, NextResponse } from "next/server";
import {
  imageUploadLimitError,
  uploadLimitError,
} from "@/lib/api/upload-policy";
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
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";
import { promoteUpload } from "@/lib/api/confirm/promote-upload";

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

async function getProjectStorageProvider(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      storageProvider: true,
      maxUploadBytes: true,
      videoThumbnailEnabled: true,
    },
  });

  if (!project) {
    return null;
  }

  return {
    ...project,
    cleanupProvider: project.storageProvider,
    storageProvider: fromPrismaStorageProvider(project.storageProvider),
  };
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

function validateFileInput(
  fileName: string,
  contentType: string,
): NextResponse | null {
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

    const { fileId, objectName, fileName, contentType, fileSize, variants } =
      payload.data;

    const invalidInputResponse = validateFileInput(fileName, contentType);
    if (invalidInputResponse) {
      return invalidInputResponse;
    }

    const pending = await prisma.file.findFirst({
      where: { id: fileId, projectId },
    });
    if (
      !pending ||
      pending.size !== fileSize ||
      pending.mimeType !== contentType ||
      pending.name !== fileName ||
      (pending.status === "PENDING" &&
        pending.uploadObjectName !== objectName)
    ) {
      return NextResponse.json(
        { message: "Upload does not match a pending presigned request." },
        { status: 400 },
      );
    }

    if (pending.status === "FAILED") {
      return NextResponse.json(
        { message: "Upload processing has failed." },
        { status: 409 },
      );
    }
    if (
      pending.status === "COMPLETED" ||
      ["QUEUED", "RUNNING", "READY"].includes(pending.processingStatus)
    ) {
      return NextResponse.json(
        {
          message: "Upload was already confirmed.",
          file: pending,
          variants: pending.variants,
        },
        {
          status: ["QUEUED", "RUNNING"].includes(pending.processingStatus)
            ? 202
            : 200,
        },
      );
    }
    if (pending.status !== "PENDING") {
      return NextResponse.json(
        { message: "Upload cannot be confirmed in its current state." },
        { status: 409 },
      );
    }

    const storageAdapter = await StorageFactory.getAdapter(
      project.storageProvider,
    );
    if (!pending.objectName || !pending.uploadObjectName) {
      return NextResponse.json(
        { message: "Upload cannot be confirmed in its current state." },
        { status: 409 },
      );
    }

    const declaredSizeError = uploadLimitError(
      fileSize,
      project.maxUploadBytes,
    );
    if (declaredSizeError) return declaredSizeError;

    const uploadMetadata =
      await storageAdapter.getObjectMetadata(pending.uploadObjectName);
    const actualSize = uploadMetadata.size;
    const actualSizeError = uploadLimitError(
      actualSize,
      project.maxUploadBytes,
    );
    if (actualSizeError) return actualSizeError;
    if (actualSize !== fileSize)
      return NextResponse.json(
        { message: "Uploaded file size mismatch." },
        { status: 400 },
      );

    await promoteUpload({
      storageAdapter,
      uploadObjectName: pending.uploadObjectName,
      finalObjectName: pending.objectName,
      expectedSize: actualSize,
      sourceRevision: uploadMetadata.revision,
    });

    if (isImageMimeType(contentType)) {
      const imageSizeError = imageUploadLimitError(
        actualSize,
        project.maxUploadBytes,
      );
      if (imageSizeError) return imageSizeError;
      return handleImageConfirm({
        projectId,
        fileId,
        objectName: pending.objectName,
        uploadObjectName: pending.uploadObjectName,
        cleanupProvider: project.cleanupProvider,
        fileName,
        contentType,
        fileSize,
        variants: variants ?? [],
        storageAdapter,
      });
    }

    if (isVideoMimeType(contentType)) {
      return handleVideoConfirm({
        videoThumbnailEnabled: project.videoThumbnailEnabled,
        projectId,
        fileId,
        objectName: pending.objectName,
        uploadObjectName: pending.uploadObjectName,
        cleanupProvider: project.cleanupProvider,
        fileName,
        contentType,
        fileSize,
        storageAdapter,
      });
    }

    return handleOtherConfirm({
      fileId,
      objectName: pending.objectName,
      uploadObjectName: pending.uploadObjectName,
      cleanupProvider: project.cleanupProvider,
      fileName,
      contentType,
      fileSize,
      storageAdapter,
    });
  } catch (error) {
    apiLogger.error("file.confirm.failed", getSafeErrorMetadata(error));

    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("download")
    ) {
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
