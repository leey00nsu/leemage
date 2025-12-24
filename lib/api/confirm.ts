import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory, StorageAdapter } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";
import { AVAILABLE_FORMATS, AVAILABLE_SIZES } from "@/shared/config/image-options";
import { isImageMimeType, isVideoMimeType } from "@/shared/lib/file-utils";
import {
  confirmRequestSchema,
  variantOptionSchema,
} from "@/lib/openapi/schemas/files";
import { generateThumbnailFromBuffer, getVideoMetadataFromBuffer, VideoMetadata } from "@/lib/video/thumbnail";

export type ConfirmRequest = z.infer<typeof confirmRequestSchema>;

// DB 저장 타입
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string; // 프리셋 사이즈, 커스텀 해상도(WIDTHxHEIGHT), 또는 "thumbnail"
};

type VariantOption = z.infer<typeof variantOptionSchema>;

/**
 * 이미지 variant 처리 (스토리지에서 원본 다운로드 후 처리)
 * @param originalFormat - 원본 이미지 포맷 (중복 방지용)
 */
async function processImageVariants(
  originalBuffer: Buffer,
  projectId: string,
  fileId: string,
  requestedVariants: VariantOption[],
  storageAdapter: StorageAdapter,
  originalFormat: string
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

        // source 크기 + 원본 포맷 조합은 건너뛰기 (source로 이미 제공됨)
        if (sizeLabel === "source" && reqFormat === originalFormat) {
          console.log(`Skipping duplicate variant: ${sizeLabel}-${reqFormat} (same as source)`);
          return;
        }

        try {
          if (sizeLabel === "source") {
            const originalImageFormat =
              originalMetadata.format as (typeof AVAILABLE_FORMATS)[number];
            let bufferToUpload = originalBuffer;
            let finalFormat = originalImageFormat;
            let finalMimeType = `image/${finalFormat}`;
            const finalWidth = originalMetadata.width!;
            const finalHeight = originalMetadata.height!;
            let finalSize = originalMetadata.size!;

            // 파일명과 label에 해상도 사용
            const resolutionLabel = `${finalWidth}x${finalHeight}`;
            const variantLabel = `${resolutionLabel}-${reqFormat}`;

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
              label: resolutionLabel,
            });
          } else {
            // max300, max800, max1920 또는 WIDTHxHEIGHT 형식 처리
            let targetWidth: number;

            if (sizeLabel.startsWith("max")) {
              // max300, max800, max1920 형식 - width 기준으로 리사이즈
              targetWidth = parseInt(sizeLabel.replace("max", ""), 10);
            } else {
              // WIDTHxHEIGHT 형식 - width만 사용
              [targetWidth] = sizeLabel.split("x").map(Number);
            }

            // width 기준으로 비율 유지 리사이즈
            const pipeline = sharp(originalBuffer).resize({
              width: targetWidth,
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
            const finalWidth = processedMetadata.width!;
            const finalHeight = processedMetadata.height!;

            // 파일명과 label에 실제 해상도 사용
            const resolutionLabel = `${finalWidth}x${finalHeight}`;
            const variantLabel = `${resolutionLabel}-${reqFormat}`;

            const objectName = `${projectId}/${fileId}-${variantLabel}.${reqFormat}`;
            const variantMimeType = `image/${reqFormat}`;
            const url = await storageAdapter.uploadObject(
              objectName,
              processedBuffer,
              variantMimeType
            );

            allVariantData.push({
              url,
              width: finalWidth,
              height: finalHeight,
              size: processedBuffer.length,
              format: reqFormat,
              label: resolutionLabel,
            });
          }
        } catch (error) {
          console.error(`Error processing variant ${sizeLabel}-${reqFormat}:`, error);
          throw error;
        }
      })()
    );
  });

  await Promise.all(processingPromises);
  return allVariantData;
}

/**
 * 비디오 썸네일 처리
 */
async function processVideoThumbnail(
  originalBuffer: Buffer,
  mimeType: string,
  projectId: string,
  fileId: string,
  storageAdapter: StorageAdapter
): Promise<ImageVariantData | null> {
  try {
    console.log(`Generating thumbnail for video: ${fileId}`);
    
    const result = await generateThumbnailFromBuffer(originalBuffer, mimeType, {
      maxDimension: 800,
      format: "jpeg",
      timestamp: "00:00:01",
      timeout: 30000,
    });

    if (!result.success || !result.buffer) {
      console.warn(`Video thumbnail generation failed: ${result.error}`);
      return null;
    }

    // 썸네일 메타데이터 가져오기
    const thumbnailMetadata = await sharp(result.buffer).metadata();
    
    // 스토리지에 썸네일 업로드
    const objectName = `${projectId}/${fileId}-thumbnail.jpg`;
    const url = await storageAdapter.uploadObject(
      objectName,
      result.buffer,
      "image/jpeg"
    );

    return {
      url,
      width: thumbnailMetadata.width || result.width || 800,
      height: thumbnailMetadata.height || result.height || 450,
      size: result.buffer.length,
      format: "jpeg",
      label: "thumbnail" as (typeof AVAILABLE_SIZES)[number],
    };
  } catch (error) {
    console.error("Video thumbnail processing error:", error);
    return null;
  }
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

      // 원본 이미지 메타데이터 가져오기
      const originalMetadata = await sharp(originalBuffer).metadata();

      // 원본 파일 포맷 추출
      const originalFormat = contentType.split("/")[1] || "jpeg";

      console.log(
        `Processing ${variants.length} variants for image: ${fileName}`
      );
      const processedVariants = await processImageVariants(
        originalBuffer,
        projectId,
        fileId,
        variants,
        storageAdapter,
        originalFormat
      );
      // 원본 해상도를 label로 사용 (예: 3024x4032)
      const sourceLabel = `${originalMetadata.width || 0}x${originalMetadata.height || 0}`;
      
      const allVariants: ImageVariantData[] = [
        {
          url: objectUrl,
          width: originalMetadata.width || 0,
          height: originalMetadata.height || 0,
          size: fileSize,
          format: originalFormat,
          label: sourceLabel,
        },
        ...processedVariants,
      ];

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
          variants: allVariants as Prisma.JsonArray,
        },
      });

      return NextResponse.json(
        {
          message: "이미지 업로드 및 처리 완료",
          file: savedFile,
          variants: allVariants,
        },
        { status: 201 }
      );
    } else if (isVideoMimeType(contentType)) {
      // 비디오 파일: 메타데이터 추출 및 썸네일 생성 시도 (실패해도 업로드는 완료)
      let thumbnail: ImageVariantData | null = null;
      let videoMetadata: VideoMetadata | null = null;
      
      try {
        console.log(`Downloading video from storage: ${objectName}`);
        const originalBuffer = await storageAdapter.downloadObject(objectName);

        // 비디오 메타데이터 추출 (해상도)
        console.log(`Extracting metadata for video: ${fileName}`);
        videoMetadata = await getVideoMetadataFromBuffer(originalBuffer, contentType);

        // 썸네일 생성
        console.log(`Processing thumbnail for video: ${fileName}`);
        thumbnail = await processVideoThumbnail(
          originalBuffer,
          contentType,
          projectId,
          fileId,
          storageAdapter
        );
      } catch (thumbnailError) {
        console.warn(`Video processing skipped: ${thumbnailError}`);
        // 처리 실패해도 비디오 업로드는 계속 진행
      }

      // 비디오 원본 정보를 variants에 추가 (해상도 포함)
      const videoVariants: ImageVariantData[] = [];
      
      // 원본 비디오 정보 추가 (해상도를 label로 사용)
      if (videoMetadata) {
        const sourceLabel = `${videoMetadata.width}x${videoMetadata.height}`;
        videoVariants.push({
          url: objectUrl,
          width: videoMetadata.width,
          height: videoMetadata.height,
          size: fileSize,
          format: contentType.split("/")[1] || "mp4",
          label: sourceLabel,
        });
      }
      
      // 썸네일 추가
      if (thumbnail) {
        videoVariants.push(thumbnail);
      }

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
          variants: videoVariants as Prisma.JsonArray,
        },
      });

      return NextResponse.json(
        {
          message: thumbnail
            ? "비디오 업로드 및 썸네일 생성 완료"
            : "비디오 업로드 완료",
          file: savedFile,
          variants: videoVariants,
        },
        { status: 201 }
      );
    } else {
      // 기타 파일: pending 레코드를 completed로 업데이트
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
