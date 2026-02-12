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
    description: "Project ID",
    example: "clq1234abcd",
  }),
  fileId: z.string().openapi({
    description: "File ID",
    example: "file5678efgh",
  }),
});

// 사이즈 레이블 스키마 (프리셋 또는 커스텀 해상도 "WIDTHxHEIGHT" 형식)
const sizeLabelSchema = z.union([
  z.enum(AVAILABLE_SIZES),
  z
    .string()
    .regex(/^\d+x\d+$/, "Custom resolution must use WIDTHxHEIGHT format (e.g. 1200x800)"),
]).openapi({
  description:
    "Image size label. Preset (original, 300x300, 800x800, 1920x1080) or custom resolution (WIDTHxHEIGHT format)",
  example: "original",
});

// Variant 옵션 스키마
export const variantOptionSchema = z
  .object({
    sizeLabel: sizeLabelSchema,
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
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/...",
    }),
    width: z.number().openapi({
      description: "Image width (px)",
      example: 1920,
    }),
    height: z.number().openapi({
      description: "Image height (px)",
      example: 1080,
    }),
    size: z.number().openapi({
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
    fileSize: z.number().positive().openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
  })
  .openapi("PresignRequest");

// Presign 응답 스키마
export const presignResponseSchema = z
  .object({
    presignedUrl: z.string().openapi({
      description: "Presigned URL for direct upload to OCI",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/p/...",
    }),
    objectName: z.string().openapi({
      description: "OCI object path",
      example: "clq1234abcd/file5678efgh.jpg",
    }),
    objectUrl: z.string().openapi({
      description: "Object URL after upload completion",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/n/.../o/...",
    }),
    fileId: z.string().openapi({
      description: "Generated file ID",
      example: "file5678efgh",
    }),
    expiresAt: z.string().openapi({
      description: "Presigned URL expiration time (ISO 8601)",
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
      example: "clq1234abcd/file5678efgh.jpg",
    }),
    fileName: z.string().min(1).openapi({
      description: "Original file name",
      example: "image.jpg",
    }),
    contentType: z.string().min(1).openapi({
      description: "MIME type of the file",
      example: "image/jpeg",
    }),
    fileSize: z.number().positive().openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    variants: z
      .array(variantOptionSchema)
      .optional()
      .openapi({
        description: "(Image only) Array of image variant options to generate",
      }),
  })
  .openapi("ConfirmRequest");

// 파일 응답 스키마
export const fileResponseSchema = z
  .object({
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
    size: z.number().openapi({
      description: "File size (bytes)",
      example: 102400,
    }),
    url: z
      .string()
      .nullable()
      .openapi({
        description: "URL for non-image files",
        example: null,
      }),
    variants: z.array(imageVariantDataSchema).openapi({
      description: "Image variants list (image files only)",
    }),
    createdAt: z.string().openapi({
      description: "Created at (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "Updated at (ISO 8601)",
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
    variants: z
      .array(imageVariantDataSchema)
      .optional()
      .openapi({
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
