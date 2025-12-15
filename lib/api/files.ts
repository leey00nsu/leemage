import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/oci";
import cuid from "cuid";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";
import {
  isImageMimeType,
  getMimeType,
  validateFileSize,
  DEFAULT_MAX_FILE_SIZE,
  getFileExtension,
} from "@/shared/lib/file-utils";

// Helper to convert ReadableStream<Uint8Array> to Buffer
async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

// 클라이언트 요청 variant 옵션 스키마
const requestedVariantOptionSchema = z.object({
  sizeLabel: z.enum(AVAILABLE_SIZES),
  format: z.enum(AVAILABLE_FORMATS),
});
const requestedVariantsSchema = z.array(requestedVariantOptionSchema);

// DB 저장 타입
export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: (typeof AVAILABLE_SIZES)[number];
};

/**
 * 비이미지 파일 업로드 처리
 */
async function handleNonImageUpload(
  file: File,
  projectId: string,
  fileId: string
): Promise<{
  url: string;
  mimeType: string;
  size: number;
}> {
  const buffer = await streamToBuffer(file.stream());
  const mimeType = getMimeType(file);
  const extension = getFileExtension(file.name) || "bin";
  const objectName = `${projectId}/${fileId}.${extension}`;

  const url = await uploadObject(objectName, buffer, mimeType);

  return {
    url,
    mimeType,
    size: buffer.length,
  };
}

/**
 * 이미지 파일 업로드 및 variant 처리
 */
async function handleImageUpload(
  file: File,
  projectId: string,
  fileId: string,
  requestedVariants: z.infer<typeof requestedVariantsSchema>
): Promise<{
  variants: ImageVariantData[];
  mimeType: string;
  size: number;
}> {
  const originalBuffer = await streamToBuffer(file.stream());
  const mimeType = getMimeType(file);
  const originalMetadata = await sharp(originalBuffer).metadata();

  if (
    !originalMetadata.format ||
    !originalMetadata.width ||
    !originalMetadata.height ||
    !originalMetadata.size
  ) {
    throw new Error("Failed to get metadata from original image.");
  }

  const allVariantData: ImageVariantData[] = [];
  const processingPromises: Promise<void>[] = [];

  requestedVariants.forEach((variantOption) => {
    processingPromises.push(
      (async () => {
        const { sizeLabel, format: reqFormat } = variantOption;
        const errorLabel = `${sizeLabel}-${reqFormat}`;

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
                  bufferToUpload = await pipeline
                    .jpeg(formatOptions)
                    .toBuffer();
                  break;
                case "png":
                  bufferToUpload = await pipeline.png().toBuffer();
                  break;
                case "avif":
                  bufferToUpload = await pipeline
                    .avif({ quality: 50 })
                    .toBuffer();
                  break;
                case "webp":
                default:
                  bufferToUpload = await pipeline
                    .webp(formatOptions)
                    .toBuffer();
                  break;
              }
              finalFormat = reqFormat;
              finalMimeType = `image/${reqFormat}`;
              finalSize = bufferToUpload.length;
            }

            const objectName = `${projectId}/${fileId}-${errorLabel}.${finalFormat}`;
            const url = await uploadObject(
              objectName,
              bufferToUpload,
              finalMimeType
            );

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
                processedBuffer = await pipeline
                  .avif({ quality: 50 })
                  .toBuffer();
                break;
              case "webp":
              default:
                processedBuffer = await pipeline.webp(formatOptions).toBuffer();
                break;
            }

            const processedMetadata = await sharp(processedBuffer).metadata();
            const objectName = `${projectId}/${fileId}-${errorLabel}.${reqFormat}`;
            const variantMimeType = `image/${reqFormat}`;
            const url = await uploadObject(
              objectName,
              processedBuffer,
              variantMimeType
            );

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
          console.error(`Error processing variant ${errorLabel}:`, error);
          throw error;
        }
      })()
    );
  });

  await Promise.all(processingPromises);

  return {
    variants: allVariantData,
    mimeType,
    size: originalBuffer.length,
  };
}

export async function uploadFileHandler(
  request: NextRequest,
  projectId: string
) {
  const contentType = request.headers.get("content-type");

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  if (!contentType || !contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      {
        message:
          "서버에서 잘못된 Content-Type을 받았습니다. multipart/form-data 형식이 필요합니다.",
      },
      { status: 415 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const variantsString = formData.get("variants") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증
    if (!validateFileSize(file, DEFAULT_MAX_FILE_SIZE)) {
      return NextResponse.json(
        { message: "파일 크기가 제한(50MB)을 초과했습니다." },
        { status: 413 }
      );
    }

    const fileId = cuid();
    const originalName = file.name;
    const mimeType = getMimeType(file);
    const isImage = isImageMimeType(mimeType);

    if (isImage) {
      // 이미지 파일 처리
      if (!variantsString) {
        return NextResponse.json(
          { message: "이미지 파일은 variants 정보가 필요합니다." },
          { status: 400 }
        );
      }

      let requestedVariants: z.infer<typeof requestedVariantsSchema>;
      try {
        requestedVariants = requestedVariantsSchema.parse(
          JSON.parse(variantsString)
        );
      } catch (error) {
        return NextResponse.json(
          {
            message: "잘못된 variants 형식입니다.",
            errors: (error as z.ZodError)?.flatten?.(),
          },
          { status: 400 }
        );
      }

      if (requestedVariants.length === 0) {
        return NextResponse.json(
          {
            message:
              "최소 하나 이상의 이미지 옵션(크기 및 포맷)을 선택해야 합니다.",
          },
          { status: 400 }
        );
      }

      const { variants, size } = await handleImageUpload(
        file,
        projectId,
        fileId,
        requestedVariants
      );

      const savedFile = await prisma.image.create({
        data: {
          id: fileId,
          name: originalName || `image-${fileId}`,
          mimeType,
          isImage: true,
          size,
          variants: variants as Prisma.JsonArray,
          projectId,
        },
      });

      return NextResponse.json(
        {
          message: "이미지 업로드 및 처리 성공",
          file: savedFile,
          variants,
        },
        { status: 201 }
      );
    } else {
      // 비이미지 파일 처리
      const { url, size } = await handleNonImageUpload(file, projectId, fileId);

      const savedFile = await prisma.image.create({
        data: {
          id: fileId,
          name: originalName || `file-${fileId}`,
          mimeType,
          isImage: false,
          size,
          url,
          variants: [],
          projectId,
        },
      });

      return NextResponse.json(
        {
          message: "파일 업로드 성공",
          file: savedFile,
          url,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("File upload API error:", error);
    return NextResponse.json(
      { message: "파일 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}


// 이전 함수명과의 호환성을 위한 별칭
export const uploadImageHandler = uploadFileHandler;
