import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory, StorageAdapter } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";
import { AVAILABLE_FORMATS, AVAILABLE_SIZES } from "@/shared/config/image-options";
import { isImageMimeType } from "@/shared/lib/file-utils";
import {
  confirmRequestSchema,
  variantOptionSchema,
} from "@/lib/openapi/schemas/files";

export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;

// DB 저장 타입
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: (typeof AVAILABLE_SIZES)[number];
};

type VariantOption = z.infer<typeof variantOptionSchema>;

/**
 * 이미지 variant 처리 (스토리지에서 원본 다운로드 후 처리)
 */
async function processImageVariants(
  originalBuffer: Buffer,
  projectId: string,
  fileId: string,
  requestedVariants: VariantOption[],
  storageAdapter: StorageAdapter
): Promise<ImageVariantData[]> {
  const originalMetadata = await sharp(originalBuffer).metadata();

  if (
    !originalMetadata.format ||
    !originalMetadata.width ||
    !originalMetadata.height ||
    !originalMetadata.size
  ) {
    throw new Error("이미지 메타데이터를 가져올 수 없습니다.");
  }

  const allVariantData: ImageVariantData[] = [];
  const processingPromises: Promise<void>[] = [];


  requestedVariants.forEach((variantOption) => {
    processingPromises.push(
      (async () => {
        const { sizeLabel, format: reqFormat } = variantOption;
        const variantLabel = `${sizeLabel}-${reqFormat}`;

        try {
          if (sizeLabel === "original") {
            const originalImageFormat =
              originalMetadata.format as (typeof AVAILABLE_FORMATS)[number];
            let bufferToUpload = originalBuffer;
            let finalFormat = originalImageFormat;
            let finalMimeType = `image/${finalFormat}`;
            const finalWidth = originalMetadata.width!;
            const finalHeight = originalMetadata.height!;
            let finalSize = originalMetadata.size!;

            if (reqFormat !== originalImageFormat) {
              const pipeline = sharp(originalBuffer);
              const formatOptions = { quality: 80 };
              switch (reqFormat) {
                case "jpeg":
                  bufferToUpload = await pipeline.jpeg(formatOptions).toBuffer();
                  break;
                case "png":
                  bufferToUpload = await pipeline.png().toBuffer();
                  break;
                case "avif":
                  bufferToUpload = await pipeline.avif({ quality: 50 }).toBuffer();
                  break;
                case "webp":
                default:
                  bufferToUpload = await pipeline.webp(formatOptions).toBuffer();
                  break;
              }
              finalFormat = reqFormat;
              finalMimeType = `image/${reqFormat}`;
              finalSize = bufferToUpload.length;
            }

            const objectName = `${projectId}/${fileId}-${variantLabel}.${finalFormat}`;
            const url = await storageAdapter.uploadObject(objectName, bufferToUpload, finalMimeType);

            allVariantData.push({
              url,
              width: finalWidth,
              height: finalHeight,
              size: finalSize,
              format: finalFormat,
              label: sizeLabel,
            });
          } else {
            const [reqWidth, reqHeight] = sizeLabel.split("x").map(Number);
            const pipeline = sharp(originalBuffer).resize({
              width: reqWidth,
              height: reqHeight,
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            });

            let processedBuffer: Buffer;
            const formatOptions = { quality: 80 };
            switch (reqFormat) {
              case "jpeg":
                processedBuffer = await pipeline.jpeg(formatOptions).toBuffer();
                break;
              case "png":
                processedBuffer = await pipeline.png().toBuffer();
                break;
              case "avif":
                processedBuffer = await pipeline.avif({ quality: 50 }).toBuffer();
                break;
              case "webp":
              default:
                processedBuffer = await pipeline.webp(formatOptions).toBuffer();
                break;
            }

            const processedMetadata = await sharp(processedBuffer).metadata();
            const objectName = `${projectId}/${fileId}-${variantLabel}.${reqFormat}`;
            const variantMimeType = `image/${reqFormat}`;
            const url = await storageAdapter.uploadObject(objectName, processedBuffer, variantMimeType);

            allVariantData.push({
              url,
              width: processedMetadata.width!,
              height: processedMetadata.height!,
              size: processedBuffer.length,
              format: reqFormat,
              label: sizeLabel,
            });
          }
        } catch (error) {
          console.error(`Error processing variant ${variantLabel}:`, error);
          throw error;
        }
      })()
    );
  });

  await Promise.all(processingPromises);
  return allVariantData;
}


/**
 * 업로드 완료 확인 핸들러
 * 클라이언트가 스토리지에 직접 업로드한 후 호출하여 pending 레코드를 completed로 업데이트합니다.
 */
export async function confirmHandler(
  request: NextRequest,
  projectId: string
): Promise<NextResponse> {
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
    const parseResult = confirmRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          message: "잘못된 요청 형식입니다.",
          errors: parseResult.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { fileId, objectName, fileName, contentType, fileSize, variants } =
      parseResult.data;

    // pending 상태의 레코드 확인
    const pendingFile = await prisma.image.findFirst({
      where: {
        id: fileId,
        projectId,
        status: "PENDING",
      },
    });

    if (!pendingFile) {
      return NextResponse.json(
        { message: "유효하지 않은 파일 ID이거나 이미 처리된 파일입니다." },
        { status: 400 }
      );
    }

    // 프로젝트의 스토리지 프로바이더에 맞는 어댑터 가져오기
    const storageProvider = fromPrismaStorageProvider(project.storageProvider);
    const storageAdapter = await StorageFactory.getAdapter(storageProvider);

    const isImage = isImageMimeType(contentType);

    // 객체 URL 생성
    const objectUrl = storageAdapter.getObjectUrl(objectName);

    if (isImage && variants && variants.length > 0) {
      // 이미지 파일: 스토리지에서 원본 다운로드 후 variants 처리
      console.log(`Downloading original image from storage: ${objectName}`);
      const originalBuffer = await storageAdapter.downloadObject(objectName);

      console.log(
        `Processing ${variants.length} variants for image: ${fileName}`
      );
      const processedVariants = await processImageVariants(
        originalBuffer,
        projectId,
        fileId,
        variants,
        storageAdapter
      );

      // pending 레코드를 completed로 업데이트
      const savedFile = await prisma.image.update({
        where: { id: fileId },
        data: {
          name: fileName,
          mimeType: contentType,
          isImage: true,
          size: fileSize,
          objectName,
          status: "COMPLETED",
          variants: processedVariants as Prisma.JsonArray,
        },
      });

      return NextResponse.json(
        {
          message: "이미지 업로드 및 처리 완료",
          file: savedFile,
          variants: processedVariants,
        },
        { status: 201 }
      );
    } else {
      // 비이미지 파일: pending 레코드를 completed로 업데이트
      const savedFile = await prisma.image.update({
        where: { id: fileId },
        data: {
          name: fileName,
          mimeType: contentType,
          isImage: false,
          size: fileSize,
          url: objectUrl,
          objectName,
          status: "COMPLETED",
          variants: [],
        },
      });

      return NextResponse.json(
        {
          message: "파일 업로드 완료",
          file: savedFile,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Confirm API error:", error);

    // 다운로드 실패 시 특별 처리
    if (error instanceof Error && error.message.includes("다운로드")) {
      return NextResponse.json(
        { message: "업로드된 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "파일 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
