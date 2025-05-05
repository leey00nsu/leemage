import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/oci";
import cuid from "cuid";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import { z } from "zod";
import { withApiKeyAuth } from "@/lib/auth/api-key-auth";

// Helper to convert ReadablStream<Uint8Array> to Buffer (동일)
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

// --- 타입 및 스키마 정의 --- (동일)
const AVAILABLE_SIZES = [
  "original",
  "300x300",
  "800x800",
  "1920x1080",
] as const;
const AVAILABLE_FORMATS = ["png", "jpeg", "avif", "webp"] as const;

const requestedVariantOptionSchema = z.object({
  sizeLabel: z.enum(AVAILABLE_SIZES).refine((s) => s !== "original", {
    message: "'original' size cannot be requested directly.",
  }),
  format: z.enum(AVAILABLE_FORMATS),
});
const requestedVariantsSchema = z.array(requestedVariantOptionSchema);
const saveOriginalSchema = z.boolean().optional().default(true);

export type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: (typeof AVAILABLE_SIZES)[number];
};
// ------------------------ //

// --- 기존 POST 핸들러 로직 (시그니처 수정) ---
async function handleImageUpload(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  // projectId 직접 사용
  const { projectId } = context.params;
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID required" },
      { status: 400 }
    );
  }

  const contentType = request.headers.get("content-type");
  console.log("[API v1 Image Upload] Received Content-Type:", contentType);

  if (!contentType || !contentType.includes("multipart/form-data")) {
    console.error(
      "[API v1 Image Upload] Error: Invalid Content-Type received:",
      contentType
    );
    return NextResponse.json(
      { message: "Invalid Content-Type. multipart/form-data required." },
      { status: 415 }
    );
  }

  try {
    console.log("[API v1 Image Upload] Attempting to parse formData...");
    const formData = await request.formData();
    console.log("[API v1 Image Upload] Successfully parsed formData.");

    const file = formData.get("file") as File | null;
    const variantsString = formData.get("variants") as string | null;
    const saveOriginalString = formData.get("saveOriginal") as string | null;

    if (!file || !variantsString) {
      return NextResponse.json(
        { message: "File and variants required" },
        { status: 400 }
      );
    }

    // ... (요청 옵션 파싱 및 유효성 검사 로직 동일) ...
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
      console.error("[API v1 Image Upload] Invalid variants format:", error);
      return NextResponse.json(
        {
          message: "Invalid variants format.",
          errors: (error as z.ZodError)?.flatten?.(),
        },
        { status: 400 }
      );
    }

    if (requestedVariants.length === 0 && !saveOriginal) {
      // 원본도 저장 안하고 variant도 없으면 에러
      return NextResponse.json(
        { message: "At least one variant or saving the original is required." },
        { status: 400 }
      );
    }

    // ... (원본 버퍼/메타데이터 추출 로직 동일) ...
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
    const processingErrors: { label: string; error: string }[] = []; // 에러 수집 배열

    // ... (원본 및 variant 처리/업로드 로직 동일) ...
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
            processingErrors.push({
              label: "original",
              error: error instanceof Error ? error.message : String(error),
            });
            console.error(
              "[API v1 Image Upload] Error processing original variant:",
              error
            );
          }
        })()
      );
    }

    // 3. 요청된 각 variant 처리 및 업로드
    requestedVariants.forEach((variantOption) => {
      processingPromises.push(
        (async () => {
          const errorLabel = `${variantOption.sizeLabel}-${variantOption.format}`;
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
            processingErrors.push({
              label: errorLabel,
              error: error instanceof Error ? error.message : String(error),
            });
            console.error(
              `[API v1 Image Upload] Error processing variant ${errorLabel}:`,
              error
            );
          }
        })()
      );
    });

    await Promise.all(processingPromises); // 모든 처리 완료 기다림

    // 4. 최소 하나 이상의 variant가 성공적으로 처리되었는지 확인
    if (allVariantData.length === 0) {
      console.error(
        "[API v1 Image Upload] No variants were successfully processed.",
        processingErrors
      );
      return NextResponse.json(
        {
          message: "모든 이미지 버전 처리 중 오류가 발생했습니다.",
          errors: processingErrors,
        },
        { status: 500 }
      );
    }

    // 5. DB에 이미지 정보 저장
    const newImage = await prisma.image.create({
      data: {
        id: imageIdBase, // 기본 ID 사용
        name: originalName,
        projectId: projectId,
        variants: allVariantData as unknown as Prisma.InputJsonValue, // JSON 타입으로 저장
      },
      select: { id: true, name: true, variants: true, projectId: true }, // 필요한 정보만 반환
    });

    // 처리 중 발생한 오류가 있다면 응답에 포함 (성공 데이터와 함께)
    if (processingErrors.length > 0) {
      console.warn(
        "[API v1 Image Upload] Some variants failed:",
        processingErrors
      );
      return NextResponse.json(
        {
          message:
            "이미지가 부분적으로 업로드되었지만 일부 버전 처리 중 오류 발생",
          image: newImage,
          errors: processingErrors,
        },
        { status: 207 }
      ); // Multi-Status
    }

    return NextResponse.json({ image: newImage }, { status: 201 });
  } catch (error) {
    console.error("[API v1 Image Upload] Image upload API error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "이미지 업로드 중 오류 발생",
      },
      { status: 500 }
    );
  }
}

// --- 핸들러 export (타입 단언 제거) ---
export const POST = withApiKeyAuth(handleImageUpload);
