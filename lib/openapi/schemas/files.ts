import { projectTagSchema } from "./tags";
import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";

// 파일 ID 파라미터 스키마
export const fileIdParamSchema = z.object({
  projectId: z.string().openapi({
    param: {
      description: "Project ID",
      example: "clq1234abcd",
    },
  }),
  fileId: z.string().openapi({
    param: {
      description: "File ID",
      example: "file5678efgh",
    },
  }),
});

// 사이즈 레이블 스키마 (프리셋 또는 커스텀 해상도 "WIDTHxHEIGHT" 형식)
const sizeLabelSchema = z
  .union([
    z.enum(AVAILABLE_SIZES),
    z.literal("thumbnail"),
    z
      .string()
      .regex(/^max[1-9]\d{0,4}$/)
      .refine((v) => Number(v.slice(3)) <= 10000),
    z
      .string()
      .regex(
        /^\d+x\d+$/,
        "Custom resolution must use WIDTHxHEIGHT format (e.g. 1200x800)",
      )
      .refine(
        (v) => v.split("x").every((n) => Number(n) >= 1 && Number(n) <= 10000),
        "Dimensions must be between 1 and 10000",
      ),
  ])
  .openapi({
    description:
      "Image size label. Presets: source (original), max300 (width 300px), max800 (width 800px), max1920 (width 1920px), thumbnail (WebP inside 480x480), maxN (width 1–10000px), or custom resolution (WIDTHxHEIGHT, each 1–10000px).",
    example: "source",
  });

// Variant 옵션 스키마
export const variantOptionSchema = z
  .object({
    sizeLabel: sizeLabelSchema,
    fit: z.enum(["inside", "cover"]).optional().openapi({
      description:
        "Custom sizes: inside preserves aspect ratio within both bounds; cover center-crops to exact dimensions. Default inside. Thumbnail is always inside.",
    }),
    format: z.enum(AVAILABLE_FORMATS).openapi({
      description: "Image format",
      example: "webp",
    }),
  })
  .openapi("VariantOption");

// 이미지 Variant 데이터 스키마
export const imageVariantDataSchema = z
  .object({
    url: z.string().openapi({
      description: "Image URL",
      format: "uri",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/...",
    }),
    width: z.number().int().min(1).openapi({
      description: "Image width (px)",
      example: 1920,
    }),
    height: z.number().int().min(1).openapi({
      description: "Image height (px)",
      example: 1080,
    }),
    size: z.number().int().nonnegative().openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    format: z.string().openapi({
      description: "Image format",
      example: "webp",
    }),
    label: z.string().openapi({
      description: "Size label",
      example: "original",
    }),
  })
  .openapi("ImageVariantData");

// Presign 요청 스키마
export const presignRequestSchema = z
  .object({
    fileName: z.string().min(1).openapi({
      description: "Name of the file to upload",
      example: "image.jpg",
    }),
    contentType: z.string().min(1).openapi({
      description: "MIME type of the file",
      example: "image/jpeg",
    }),
    fileSize: z.number().int().min(1).openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    width: z.number().int().min(1).optional().openapi({
      description:
        "(Image only) Original image width in pixels. Provide with height to include exact resolution in objectName; when omitted, source placeholder naming is used.",
      example: 421,
    }),
    height: z.number().int().min(1).optional().openapi({
      description:
        "(Image only) Original image height in pixels. Provide with width to include exact resolution in objectName; when omitted, source placeholder naming is used.",
      example: 524,
    }),
  })
  .refine(
    (data) =>
      (data.width === undefined && data.height === undefined) ||
      (data.width !== undefined && data.height !== undefined),
    {
      message: "width and height must be provided together.",
      path: ["height"],
    },
  )
  .openapi("PresignRequest", {
    example: {
      fileName: "image.jpg",
      contentType: "image/jpeg",
      fileSize: 102400,
      width: 421,
      height: 524,
    },
  });

// Presign 응답 스키마
export const presignResponseSchema = z
  .object({
    presignedUrl: z.string().openapi({
      description: "Presigned URL for direct upload to OCI",
      format: "uri",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/p/...",
    }),
    objectName: z.string().openapi({
      description:
        "OCI object path. Image objects use either {fileId}-{width}x{height}-{ext}.{ext} (when width/height are provided) or {fileId}-source-{ext}.{ext} (when omitted).",
      example: "clq1234abcd/file5678efgh-source-jpg.jpg",
    }),
    objectUrl: z.string().openapi({
      description: "Object URL after upload completion",
      format: "uri",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/n/.../o/...",
    }),
    fileId: z.string().openapi({
      description: "Generated file ID",
      example: "file5678efgh",
    }),
    expiresAt: z.string().openapi({
      description: "Presigned URL expiration time (ISO 8601)",
      format: "date-time",
      example: "2023-01-01T00:15:00.000Z",
    }),
  })
  .openapi("PresignResponse");

// Confirm 요청 스키마
export const confirmRequestSchema = z
  .object({
    fileId: z.string().min(1).openapi({
      description: "File ID from presign response",
      example: "file5678efgh",
    }),
    objectName: z.string().min(1).openapi({
      description: "Object name from presign response",
      example: "clq1234abcd/file5678efgh-source-jpg.jpg",
    }),
    fileName: z.string().min(1).openapi({
      description: "Original file name",
      example: "image.jpg",
    }),
    contentType: z.string().min(1).openapi({
      description: "MIME type of the file",
      example: "image/jpeg",
    }),
    fileSize: z.number().int().min(1).openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    variants: z.array(variantOptionSchema).max(5).optional().openapi({
      description:
        "(Image only) Up to 5 image variant options to generate asynchronously",
    }),
  })
  .openapi("ConfirmRequest", {
    example: {
      fileId: "file5678efgh",
      objectName: "clq1234abcd/file5678efgh-source-jpg.jpg",
      fileName: "image.jpg",
      contentType: "image/jpeg",
      fileSize: 102400,
      variants: [
        { sizeLabel: "source", format: "webp" },
        { sizeLabel: "max800", format: "jpeg" },
      ],
    },
  });

// 파일 응답 스키마
export const fileResponseSchema = z
  .object({
    processingStatus: z.string().optional().openapi({
      description:
        "Image/video processing: NONE, QUEUED, RUNNING, READY, FAILED, or SKIPPED. Original is available while queued/running or after a transient failure.",
    }),
    id: z.string().openapi({
      description: "File ID",
      example: "file5678efgh",
    }),
    name: z.string().openapi({
      description: "File name",
      example: "image.jpg",
    }),
    mimeType: z.string().openapi({
      description: "MIME type",
      example: "image/jpeg",
    }),
    isImage: z.boolean().openapi({
      description: "Whether it is an image file",
      example: true,
    }),
    size: z.number().int().nonnegative().openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    url: z.string().nullable().openapi({
      description: "URL for non-image files",
      format: "uri",
      example: null,
    }),
    tags: z.array(projectTagSchema).optional().openapi({
      description:
        "Tags assigned to this file in its project. Included in project file listings.",
    }),
    thumbnail: imageVariantDataSchema.nullable().optional().openapi({
      description:
        "Shared image preview (WebP inside 480x480) or asynchronously generated video preview (JPEG inside 800x800). Null while video processing is pending, disabled or failed.",
    }),
    variants: z.array(imageVariantDataSchema).openapi({
      description: "Image variants list (image files only)",
    }),
    createdAt: z.string().openapi({
      description: "Created at (ISO 8601)",
      format: "date-time",
      example: "2023-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "Updated at (ISO 8601)",
      format: "date-time",
      example: "2023-01-01T00:00:00.000Z",
    }),
    projectId: z.string().openapi({
      description: "Project ID",
      example: "clq1234abcd",
    }),
  })
  .openapi("FileResponse");

// Confirm 응답 스키마
export const confirmResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Success message",
      example: "File upload complete",
    }),
    file: fileResponseSchema,
    variants: z.array(imageVariantDataSchema).optional().openapi({
      description: "Generated image variants",
    }),
  })
  .openapi("ConfirmResponse");

// 스키마 등록
registry.register("VariantOption", variantOptionSchema);
registry.register("ImageVariantData", imageVariantDataSchema);
registry.register("PresignRequest", presignRequestSchema);
registry.register("PresignResponse", presignResponseSchema);
registry.register("ConfirmRequest", confirmRequestSchema);
registry.register("ConfirmResponse", confirmResponseSchema);
registry.register("FileResponse", fileResponseSchema);
