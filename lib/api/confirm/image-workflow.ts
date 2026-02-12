import { NextResponse } from "next/server";
import sharp from "sharp";
import { Prisma } from "@/lib/generated/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { prisma } from "@/lib/prisma";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";
import { validateMagicBytes } from "@/lib/validation/file-validator";
import { type ImageVariantData, type VariantOption } from "@/lib/api/confirm/types";

async function processImageVariants(
  originalBuffer: Buffer,
  projectId: string,
  fileId: string,
  requestedVariants: VariantOption[],
  storageAdapter: StorageAdapter,
  originalFormat: string,
): Promise<ImageVariantData[]> {
  const originalMetadata = await sharp(originalBuffer).metadata();

  if (
    !originalMetadata.format ||
    !originalMetadata.width ||
    !originalMetadata.height ||
    !originalMetadata.size
  ) {
    throw new Error("Failed to read image metadata.");
  }

  const allVariantData: ImageVariantData[] = [];
  const processingPromises: Promise<void>[] = [];

  requestedVariants.forEach((variantOption) => {
    processingPromises.push(
      (async () => {
        const { sizeLabel, format: reqFormat } = variantOption;

        if (sizeLabel === "source" && reqFormat === originalFormat) {
          return;
        }

        try {
          if (sizeLabel === "source") {
            const originalImageFormat = originalMetadata.format;
            let bufferToUpload = originalBuffer;
            let finalFormat = originalImageFormat;
            let finalMimeType = `image/${finalFormat}`;
            const finalWidth = originalMetadata.width ?? 0;
            const finalHeight = originalMetadata.height ?? 0;
            let finalSize = originalMetadata.size ?? 0;

            const resolutionLabel = `${finalWidth}x${finalHeight}`;

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

            const objectName = `${projectId}/${fileId}-${resolutionLabel}-${reqFormat}.${finalFormat}`;
            const url = await storageAdapter.uploadObject(
              objectName,
              bufferToUpload,
              finalMimeType,
            );

            allVariantData.push({
              url,
              width: finalWidth,
              height: finalHeight,
              size: finalSize,
              format: finalFormat,
              label: resolutionLabel,
            });
            return;
          }

          let targetWidth: number;
          if (sizeLabel.startsWith("max")) {
            targetWidth = parseInt(sizeLabel.replace("max", ""), 10);
          } else {
            [targetWidth] = sizeLabel.split("x").map(Number);
          }

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
          const finalWidth = processedMetadata.width ?? 0;
          const finalHeight = processedMetadata.height ?? 0;

          const resolutionLabel = `${finalWidth}x${finalHeight}`;
          const objectName = `${projectId}/${fileId}-${resolutionLabel}-${reqFormat}.${reqFormat}`;

          const url = await storageAdapter.uploadObject(
            objectName,
            processedBuffer,
            `image/${reqFormat}`,
          );

          allVariantData.push({
            url,
            width: finalWidth,
            height: finalHeight,
            size: processedBuffer.length,
            format: reqFormat,
            label: resolutionLabel,
          });
        } catch (error) {
          console.error(
            `Error processing variant ${variantOption.sizeLabel}-${variantOption.format}:`,
            error,
          );
          throw error;
        }
      })(),
    );
  });

  await Promise.all(processingPromises);
  return allVariantData;
}

interface HandleImageConfirmInput {
  projectId: string;
  fileId: string;
  objectName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  variants: VariantOption[];
  storageAdapter: StorageAdapter;
}

export async function handleImageConfirm({
  projectId,
  fileId,
  objectName,
  fileName,
  contentType,
  fileSize,
  variants,
  storageAdapter,
}: HandleImageConfirmInput): Promise<NextResponse> {
  const objectUrl = storageAdapter.getObjectUrl(objectName);

  const originalBuffer = await storageAdapter.downloadObject(objectName);

  if (!validateMagicBytes(originalBuffer, contentType)) {
    await prisma.file.delete({ where: { id: fileId } });
    await storageAdapter.deleteObject(objectName).catch(() => {});

    return NextResponse.json(
      { message: "File content does not match the declared content type." },
      { status: 400 },
    );
  }

  const originalMetadata = await sharp(originalBuffer).metadata();
  const originalFormat = contentType.split("/")[1] || "jpeg";

  const processedVariants = await processImageVariants(
    originalBuffer,
    projectId,
    fileId,
    variants,
    storageAdapter,
    originalFormat,
  );

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

  const savedFile = await prisma.file.update({
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

  const thumbnailVariant = allVariants.reduce((smallest, variant) =>
    variant.size < smallest.size ? variant : smallest,
  );

  const response = NextResponse.json(
    {
      message: "Image upload and processing complete",
      file: savedFile,
      variants: allVariants,
    },
    { status: 201 },
  );

  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "image",
    variantCount: allVariants.length,
    thumbnailUrl: thumbnailVariant.url,
  });

  return response;
}
