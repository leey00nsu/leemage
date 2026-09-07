import type { FormatType } from "@/shared/config/image-options";

export interface ImageTransformRequest {
  sizeLabel: string;
  format: FormatType;
  fit?: "inside" | "cover";
}
export interface ImageTransformPlan {
  width: number;
  height: number;
  format: FormatType;
  fit: "inside" | "cover";
  thumbnail: boolean;
  key: string;
}

// Shared by the upload summary and server so counts and output dimensions agree.
export function planImageTransforms(
  width: number,
  height: number,
  originalFormat: string,
  requests: ImageTransformRequest[],
) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1)
    throw new Error("Invalid original image dimensions");
  const plans = new Map<string, ImageTransformPlan>();
  for (const request of [
    { sizeLabel: "thumbnail", format: "webp" as const },
    ...requests,
  ]) {
    if (request.sizeLabel === "source" && request.format === originalFormat)
      continue;
    const thumbnail = request.sizeLabel === "thumbnail";
    if (thumbnail && (request.format !== "webp" || request.fit === "cover"))
      throw new Error("Thumbnail must use WebP with inside fit");
    const fit =
      thumbnail || request.sizeLabel.startsWith("max") || request.sizeLabel === "source"
        ? "inside"
        : (request.fit ?? "inside");
    let targetWidth = width;
    let targetHeight = height;
    if (thumbnail) {
      targetWidth = 480;
      targetHeight = 480;
    } else if (/^max\d+$/.test(request.sizeLabel)) {
      targetWidth = Number(request.sizeLabel.slice(3));
      targetHeight = (height * targetWidth) / width;
    } else if (/^\d+x\d+$/.test(request.sizeLabel)) {
      [targetWidth, targetHeight] = request.sizeLabel.split("x").map(Number);
    } else if (request.sizeLabel !== "source")
      throw new Error("Invalid image size");
    if (
      !thumbnail &&
      request.sizeLabel !== "source" &&
      (targetWidth < 1 ||
        targetWidth > 10000 ||
        (!request.sizeLabel.startsWith("max") &&
          (targetHeight < 1 || targetHeight > 10000)))
    )
      throw new Error("Image dimensions must be between 1 and 10000");
    if (fit === "cover" && (targetWidth > width || targetHeight > height))
      throw new Error("Crop dimensions must not exceed the original");
    const scale = Math.min(1, targetWidth / width, targetHeight / height);
    const outWidth =
      fit === "cover" ? targetWidth : Math.max(1, Math.round(width * scale));
    const outHeight =
      fit === "cover" ? targetHeight : Math.max(1, Math.round(height * scale));
    // Cropping has no effect when the output has the same aspect ratio.
    const effectiveFit =
      outWidth * height === outHeight * width ? "inside" : fit;
    const key = `${outWidth}x${outHeight}-${effectiveFit}-${request.format}`;
    if (!plans.has(key))
      plans.set(key, {
        width: outWidth,
        height: outHeight,
        format: request.format,
        fit: effectiveFit,
        thumbnail,
        key,
      });
  }
  return [...plans.values()];
}
