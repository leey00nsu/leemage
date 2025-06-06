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

// Helper to convert ReadablStream<Uint8Array> to Buffer
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

export async function uploadImageHandler(
  request: NextRequest,
  projectId: string
) {
  // Content-Type 헤더 확인
  const contentType = request.headers.get("content-type");
  console.log("Received Content-Type:", contentType);

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  if (!contentType || !contentType.includes("multipart/form-data")) {
    console.error("Error: Invalid Content-Type received:", contentType);
    return NextResponse.json(
      {
        message:
          "서버에서 잘못된 Content-Type을 받았습니다. multipart/form-data 형식이 필요합니다.",
      },
      { status: 415 }
    );
  }

  try {
    console.log("Attempting to parse formData...");
    const formData = await request.formData();
    console.log("Successfully parsed formData.");

    const file = formData.get("file") as File | null;
    const variantsString = formData.get("variants") as string | null;

    if (!file) {
      return NextResponse.json(
        { message: "파일이 필요합니다." },
        { status: 400 }
      );
    }
    if (!variantsString) {
      return NextResponse.json(
        { message: "variants 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 요청 옵션 파싱 및 유효성 검사
    let requestedVariants: z.infer<typeof requestedVariantsSchema>;
    try {
      requestedVariants = requestedVariantsSchema.parse(
        JSON.parse(variantsString)
      );
    } catch (error) {
      console.error("Invalid variants format:", error);
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

    const originalBuffer = await streamToBuffer(file.stream());
    const originalName = file.name;
    const originalMetadata = await sharp(originalBuffer).metadata();
    const imageIdBase = cuid();

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

    // 요청된 각 variant 처리 및 업로드
    requestedVariants.forEach((variantOption) => {
      processingPromises.push(
        (async () => {
          const { sizeLabel, format: reqFormat } = variantOption;
          const errorLabel = `${sizeLabel}-${reqFormat}`;

          try {
            if (sizeLabel === "original") {
              // 원본 이미지 처리
              const originalImageFormat =
                originalMetadata.format as (typeof AVAILABLE_FORMATS)[number];
              let bufferToUpload = originalBuffer;
              let finalFormat = originalImageFormat;
              let finalMimeType = `image/${finalFormat}`;
              const finalWidth = originalMetadata.width!;
              const finalHeight = originalMetadata.height!;
              let finalSize = originalMetadata.size!;

              // 다른 포맷으로의 변환이 요청되었다면, 변환 수행
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

              const objectName = `${projectId}/${imageIdBase}-${errorLabel}.${finalFormat}`;
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
              // 리사이즈된 variant 처리
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
                  processedBuffer = await pipeline
                    .jpeg(formatOptions)
                    .toBuffer();
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
                  processedBuffer = await pipeline
                    .webp(formatOptions)
                    .toBuffer();
                  break;
              }

              const processedMetadata = await sharp(processedBuffer).metadata();
              const objectName = `${projectId}/${imageIdBase}-${errorLabel}.${reqFormat}`;
              const mimeType = `image/${reqFormat}`;
              const url = await uploadObject(
                objectName,
                processedBuffer,
                mimeType
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
            throw error; // 에러를 다시 던져서 전체 처리가 실패하도록 함
          }
        })()
      );
    });

    // 모든 variant 처리 완료 대기
    await Promise.all(processingPromises);

    if (allVariantData.length === 0) {
      throw new Error("No variants were successfully processed.");
    }

    // 데이터베이스에 이미지 정보 저장
    const savedImage = await prisma.image.create({
      data: {
        id: imageIdBase,
        name: originalName || `image-${imageIdBase}`,
        variants: allVariantData as Prisma.JsonArray,
        projectId: projectId,
      },
    });

    return NextResponse.json(
      {
        message: "이미지 업로드 및 처리 성공",
        image: savedImage,
        variants: allVariantData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Image upload API error:", error);
    return NextResponse.json(
      { message: "이미지 업로드 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
