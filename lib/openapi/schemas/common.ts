import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";

// 기본 에러 응답 스키마
export const errorResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "An error occurred while processing the request.",
    }),
    errors: z
      .record(z.array(z.string()))
      .optional()
      .openapi({
        description: "Field-level validation errors",
        example: { name: ["This field is required."] },
      }),
  })
  .openapi("ErrorResponse");

// 401 인증 실패 에러 스키마
export const unauthorizedErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "Authentication failed: invalid API key",
    }),
  })
  .openapi("UnauthorizedError");

// 404 Not Found 에러 스키마 (프로젝트)
export const projectNotFoundErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "Project not found.",
    }),
  })
  .openapi("ProjectNotFoundError");

// 404 Not Found 에러 스키마 (파일)
export const fileNotFoundErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "File not found.",
    }),
  })
  .openapi("FileNotFoundError");

// 500 서버 에러 스키마
export const serverErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "A server error occurred.",
    }),
  })
  .openapi("ServerError");

// 400 잘못된 요청 에러 스키마
export const badRequestErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "Error message",
      example: "Invalid request format.",
    }),
    errors: z
      .record(z.array(z.string()))
      .optional()
      .openapi({
        description: "Field-level validation errors",
        example: { name: ["This field is required."] },
      }),
  })
  .openapi("BadRequestError");

// 성공 메시지 응답 스키마
export const messageResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "Success message",
      example: "Operation completed successfully.",
    }),
  })
  .openapi("MessageResponse");

// 페이지네이션 파라미터 스키마
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .openapi({
      description: "Page number (starting from 1)",
      example: "1",
    }),
  limit: z
    .string()
    .optional()
    .openapi({
      description: "Number of items per page",
      example: "20",
    }),
});

// 스키마 등록
registry.register("ErrorResponse", errorResponseSchema);
registry.register("UnauthorizedError", unauthorizedErrorSchema);
registry.register("ProjectNotFoundError", projectNotFoundErrorSchema);
registry.register("FileNotFoundError", fileNotFoundErrorSchema);
registry.register("ServerError", serverErrorSchema);
registry.register("BadRequestError", badRequestErrorSchema);
registry.register("MessageResponse", messageResponseSchema);
