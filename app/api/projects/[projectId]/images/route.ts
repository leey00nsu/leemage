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
  sizeLabel: z.enum(AVAILABLE_SIZES).refine((s) => s !== "original", {
    message: "'original' size cannot be requested directly.",
  }), // original은 요청 불가
  format: z.enum(AVAILABLE_FORMATS),
});
const requestedVariantsSchema = z.array(requestedVariantOptionSchema);
// 원본 저장 플래그 (클라이언트에서 'saveOriginal' 필드로 boolean 전달 가정)
const saveOriginalSchema = z.boolean().optional().default(true);

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
    const saveOriginalString = formData.get("saveOriginal") as string | null; // 원본 저장 플래그 받기

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
    let saveOriginal: boolean;
    try {
      requestedVariants = requestedVariantsSchema.parse(
        JSON.parse(variantsString)
      );
      saveOriginal = saveOriginalSchema.parse(
        saveOriginalString ? JSON.parse(saveOriginalString) : true
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
        { message: "최소 하나 이상의 variant를 요청해야 합니다." },
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

    // 2. 원본 이미지 처리 및 업로드
    if (saveOriginal) {
      processingPromises.push(
        (async () => {
          try {
            const format =
              originalMetadata.format as (typeof AVAILABLE_FORMATS)[number];
            if (!AVAILABLE_FORMATS.includes(format)) {
              throw new Error(`Unsupported original format: ${format}`);
            }
            const objectName = `${projectId}/${imageIdBase}-original.${format}`;
            const mimeType = `image/${format}`;
            const url = await uploadObject(
              objectName,
              originalBuffer,
              mimeType
            );
            allVariantData.push({
              url,
              width: originalMetadata.width!,
              height: originalMetadata.height!,
              size: originalMetadata.size!,
              format: format,
              label: "original",
            });
          } catch (error) {
            console.error("Error processing original variant:", error);
            // 원본 처리 실패 시 오류를 던지거나 로깅만 할 수 있음
            throw new Error(
              `Failed to process original image: ${
                error instanceof Error ? error.message : error
              }`
            );
          }
        })()
      );
    }

    // 3. 요청된 각 variant 처리 및 업로드
    requestedVariants.forEach((variantOption) => {
      processingPromises.push(
        (async () => {
          try {
            const [reqWidth, reqHeight] = variantOption.sizeLabel
              .split("x")
              .map(Number);
            const reqFormat = variantOption.format;

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

            const metadata = await sharp(processedBuffer).metadata();
            if (!metadata.width || !metadata.height || !metadata.size) {
              throw new Error(
                `Failed to get metadata for ${variantOption.sizeLabel} ${reqFormat}`
              );
            }

            const objectName = `${projectId}/${imageIdBase}-${variantOption.sizeLabel}.${reqFormat}`;
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
              label: variantOption.sizeLabel,
            });
          } catch (error) {
            console.error(
              `Error processing variant ${variantOption.sizeLabel} ${variantOption.format}:`,
              error
            );
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
