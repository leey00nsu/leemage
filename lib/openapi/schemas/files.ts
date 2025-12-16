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
    description: "프로젝트 ID",
    example: "clq1234abcd",
  }),
  fileId: z.string().openapi({
    description: "파일 ID",
    example: "file5678efgh",
  }),
});

// Variant 옵션 스키마
export const variantOptionSchema = z
  .object({
    sizeLabel: z.enum(AVAILABLE_SIZES).openapi({
      description: "이미지 크기 레이블",
      example: "original",
    }),
    format: z.enum(AVAILABLE_FORMATS).openapi({
      description: "이미지 포맷",
      example: "webp",
    }),
  })
  .openapi("VariantOption");

// 이미지 Variant 데이터 스키마
export const imageVariantDataSchema = z
  .object({
    url: z.string().openapi({
      description: "이미지 URL",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/...",
    }),
    width: z.number().openapi({
      description: "이미지 너비 (px)",
      example: 1920,
    }),
    height: z.number().openapi({
      description: "이미지 높이 (px)",
      example: 1080,
    }),
    size: z.number().openapi({
      description: "파일 크기 (bytes)",
      example: 102400,
    }),
    format: z.string().openapi({
      description: "이미지 포맷",
      example: "webp",
    }),
    label: z.string().openapi({
      description: "크기 레이블",
      example: "original",
    }),
  })
  .openapi("ImageVariantData");

// Presign 요청 스키마
export const presignRequestSchema = z
  .object({
    fileName: z.string().min(1).openapi({
      description: "업로드할 파일의 이름",
      example: "image.jpg",
    }),
    contentType: z.string().min(1).openapi({
      description: "파일의 MIME 타입",
      example: "image/jpeg",
    }),
    fileSize: z.number().positive().openapi({
      description: "파일 크기 (bytes)",
      example: 102400,
    }),
  })
  .openapi("PresignRequest");

// Presign 응답 스키마
export const presignResponseSchema = z
  .object({
    presignedUrl: z.string().openapi({
      description: "OCI에 직접 업로드할 수 있는 Presigned URL",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/p/...",
    }),
    objectName: z.string().openapi({
      description: "OCI 객체 경로",
      example: "clq1234abcd/file5678efgh.jpg",
    }),
    objectUrl: z.string().openapi({
      description: "업로드 완료 후 객체 URL",
      example: "https://objectstorage.ap-seoul-1.oraclecloud.com/n/.../o/...",
    }),
    fileId: z.string().openapi({
      description: "생성된 파일 ID",
      example: "file5678efgh",
    }),
    expiresAt: z.string().openapi({
      description: "Presigned URL 만료 시간 (ISO 8601)",
      example: "2023-01-01T00:15:00.000Z",
    }),
  })
  .openapi("PresignResponse");

// Confirm 요청 스키마
export const confirmRequestSchema = z
  .object({
    fileId: z.string().min(1).openapi({
      description: "presign 응답에서 받은 파일 ID",
      example: "file5678efgh",
    }),
    objectName: z.string().min(1).openapi({
      description: "presign 응답에서 받은 객체 이름",
      example: "clq1234abcd/file5678efgh.jpg",
    }),
    fileName: z.string().min(1).openapi({
      description: "원본 파일 이름",
      example: "image.jpg",
    }),
    contentType: z.string().min(1).openapi({
      description: "파일의 MIME 타입",
      example: "image/jpeg",
    }),
    fileSize: z.number().positive().openapi({
      description: "파일 크기 (bytes)",
      example: 102400,
    }),
    variants: z
      .array(variantOptionSchema)
      .optional()
      .openapi({
        description: "(이미지 전용) 생성할 이미지 버전 옵션 배열",
      }),
  })
  .openapi("ConfirmRequest");

// 파일 응답 스키마
export const fileResponseSchema = z
  .object({
    id: z.string().openapi({
      description: "파일 ID",
      example: "file5678efgh",
    }),
    name: z.string().openapi({
      description: "파일 이름",
      example: "image.jpg",
    }),
    mimeType: z.string().openapi({
      description: "MIME 타입",
      example: "image/jpeg",
    }),
    isImage: z.boolean().openapi({
      description: "이미지 파일 여부",
      example: true,
    }),
    size: z.number().openapi({
      description: "파일 크기 (bytes)",
      example: 102400,
    }),
    url: z
      .string()
      .nullable()
      .openapi({
        description: "비이미지 파일의 URL",
        example: null,
      }),
    variants: z.array(imageVariantDataSchema).openapi({
      description: "이미지 버전 목록 (이미지 파일만 해당)",
    }),
    createdAt: z.string().openapi({
      description: "생성 일시 (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().openapi({
      description: "수정 일시 (ISO 8601)",
      example: "2023-01-01T00:00:00.000Z",
    }),
    projectId: z.string().openapi({
      description: "프로젝트 ID",
      example: "clq1234abcd",
    }),
  })
  .openapi("FileResponse");

// Confirm 응답 스키마
export const confirmResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "성공 메시지",
      example: "파일 업로드 완료",
    }),
    file: fileResponseSchema,
    variants: z
      .array(imageVariantDataSchema)
      .optional()
      .openapi({
        description: "생성된 이미지 버전 목록",
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
