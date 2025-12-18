import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";

// 기본 에러 응답 스키마
export const errorResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "요청 처리 중 오류가 발생했습니다.",
    }),
    errors: z
      .record(z.array(z.string()))
      .optional()
      .openapi({
        description: "필드별 유효성 검사 에러",
        example: { name: ["필수 항목입니다."] },
      }),
  })
  .openapi("ErrorResponse");

// 401 인증 실패 에러 스키마
export const unauthorizedErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "인증 실패: 유효하지 않은 API 키",
    }),
  })
  .openapi("UnauthorizedError");

// 404 Not Found 에러 스키마 (프로젝트)
export const projectNotFoundErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "프로젝트를 찾을 수 없습니다.",
    }),
  })
  .openapi("ProjectNotFoundError");

// 404 Not Found 에러 스키마 (파일)
export const fileNotFoundErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "파일을 찾을 수 없습니다.",
    }),
  })
  .openapi("FileNotFoundError");

// 500 서버 에러 스키마
export const serverErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "서버 오류가 발생했습니다.",
    }),
  })
  .openapi("ServerError");

// 400 잘못된 요청 에러 스키마
export const badRequestErrorSchema = z
  .object({
    message: z.string().openapi({
      description: "에러 메시지",
      example: "잘못된 요청 형식입니다.",
    }),
    errors: z
      .record(z.array(z.string()))
      .optional()
      .openapi({
        description: "필드별 유효성 검사 에러",
        example: { name: ["필수 항목입니다."] },
      }),
  })
  .openapi("BadRequestError");

// 성공 메시지 응답 스키마
export const messageResponseSchema = z
  .object({
    message: z.string().openapi({
      description: "성공 메시지",
      example: "작업이 완료되었습니다.",
    }),
  })
  .openapi("MessageResponse");

// 페이지네이션 파라미터 스키마
export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .openapi({
      description: "페이지 번호 (1부터 시작)",
      example: "1",
    }),
  limit: z
    .string()
    .optional()
    .openapi({
      description: "페이지당 항목 수",
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
