import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/oci";
import cuid from "cuid";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";

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

// --- 타입 및 스키마 정의 --- //
const AVAILABLE_SIZES = [
  "original",
  "300x300",
  "800x800",
  "1920x1080",
] as const; // 'original' 추가
const AVAILABLE_FORMATS = ["png", "jpeg", "avif", "webp"] as const;

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
  label: (typeof AVAILABLE_SIZES)[number]; // 'original' 포함
};
// ------------------------ //

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  // 1. 받은 Content-Type 헤더 로깅
  const contentType = request.headers.get("content-type");
  console.log("Received Content-Type:", contentType);

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  // 2. Content-Type 명시적 확인
  if (!contentType || !contentType.includes("multipart/form-data")) {
    console.error("Error: Invalid Content-Type received:", contentType);
    return NextResponse.json(
      {
        message:
          "서버에서 잘못된 Content-Type을 받았습니다. multipart/form-data 형식이 필요합니다.",
      },
      { status: 415 } // Unsupported Media Type
    );
  }

  try {
    // 3. FormData 파싱 시도
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

    // 1. 요청 옵션 파싱 및 유효성 검사
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

    // 요청된 각 variant 처리 및 업로드 (원본 처리 통합)
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
              // 원본 포맷이 요청된 포맷과 다를 경우 변환 (또는 오류 처리 - 현재는 요청된 포맷을 따름)
              // 여기서는 클라이언트가 "original" 사이즈에 대해 특정 포맷을 요청했다고 가정하고 진행
              // 만약 "original" 사이즈일 때는 항상 원본 포맷을 유지해야 한다면, reqFormat을 originalMetadata.format으로 사용해야 함.
              // 현재 클라이언트에서는 "original"을 선택해도 다른 포맷들을 선택 가능하므로, 요청된 reqFormat을 따르는 것이 맞을 수 있음.
              // 또는, "original" 선택 시 포맷 선택을 비활성화하거나, "original" 포맷으로 고정하는 UX도 고려 가능.
              // 여기서는 "original" size 요청시 reqFormat을 그대로 사용.

              // 원본 포맷이 지원되는지 확인 (선택적: 원본 포맷 그대로 저장 시)
              // if (!AVAILABLE_FORMATS.includes(originalImageFormat)) {
              //   throw new Error(`Unsupported original format: ${originalImageFormat}`);
              // }

              let bufferToUpload = originalBuffer;
              let finalFormat = originalImageFormat; // 기본은 원본 포맷
              let finalMimeType = `image/${finalFormat}`;
              let finalWidth = originalMetadata.width!;
              let finalHeight = originalMetadata.height!;
              let finalSize = originalMetadata.size!;

              // 만약 "original" 사이즈에 대해 다른 포맷으로의 변환이 요청되었다면, 변환 수행
              if (reqFormat !== originalImageFormat) {
                const pipeline = sharp(originalBuffer);
                const formatOptions = { quality: 80 }; // 기본 품질
                switch (reqFormat) {
                  case "jpeg":
                    bufferToUpload = await pipeline
                      .jpeg(formatOptions)
                      .toBuffer();
                    break;
                  case "png":
                    bufferToUpload = await pipeline.png().toBuffer(); // png는 quality 옵션이 다름
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
                const tempMetadata = await sharp(bufferToUpload).metadata();
                finalWidth = tempMetadata.width!;
                finalHeight = tempMetadata.height!;
                finalSize = tempMetadata.size!;
                finalFormat = reqFormat; // 최종 포맷은 요청된 포맷
                finalMimeType = `image/${finalFormat}`;
              }

              const objectName = `${projectId}/${imageIdBase}-${sizeLabel}.${finalFormat}`; // 최종 포맷 사용
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
                label: "original", // sizeLabel 대신 "original" 고정
              });
            } else {
              // 특정 크기로 리사이징 및 변환 처리
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

              const metadata = await sharp(processedBuffer).metadata();
              if (!metadata.width || !metadata.height || !metadata.size) {
                throw new Error(
                  `Failed to get metadata for ${sizeLabel} ${reqFormat}`
                );
              }

              const objectName = `${projectId}/${imageIdBase}-${sizeLabel}.${reqFormat}`;
              const mimeType = `image/${reqFormat}`;
              const url = await uploadObject(
                objectName,
                processedBuffer,
                mimeType
              );

              allVariantData.push({
                url,
                width: metadata.width,
                height: metadata.height,
                size: metadata.size,
                format: reqFormat,
                label: sizeLabel,
              });
            }
          } catch (error) {
            console.error(`Error processing variant ${errorLabel}:`, error);
            // 개별 variant 실패는 로깅만 하고 전체 실패로 간주하지 않음 (선택적)
          }
        })()
      );
    });

    // 4. 모든 처리 완료 대기
    await Promise.allSettled(processingPromises); // 모든 Promise가 완료될 때까지 기다림 (성공/실패 무관)

    // 성공적으로 처리된 데이터가 하나라도 있는지 확인 (원본 포함)
    if (allVariantData.length === 0) {
      throw new Error("이미지 처리 및 업로드에 모두 실패했습니다.");
    }

    // 5. 데이터베이스 저장
    const newImage = await prisma.image.create({
      data: {
        name: originalName,
        variants: allVariantData as Prisma.JsonArray, // 수집된 모든 variant 정보 저장
        projectId: projectId,
      },
    });

    console.log("Image original and requested variants saved to DB:", newImage);

    // 6. 성공 응답
    return NextResponse.json(newImage, { status: 201 });
  } catch (error: unknown) {
    // 에러 로깅 강화 (FormData 파싱 오류 포함 가능성)
    console.error(
      "Image upload API error (could be formData parsing issue):",
      error
    );
    let errorMessage = "이미지 업로드 중 오류가 발생했습니다.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Content-Type 오류와 관련된 특정 메시지 반환 시도
    if (
      error instanceof TypeError &&
      error.message.includes("unsupported BodyInit type")
    ) {
      errorMessage =
        "서버에서 요청 본문을 처리할 수 없습니다. 요청 형식을 확인하세요.";
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
