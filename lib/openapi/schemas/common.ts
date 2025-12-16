import "@/lib/openapi/setup";
import { z } from "zod";
import { registry } from "../registry";

// 에러 응답 스키마
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
registry.register("MessageResponse", messageResponseSchema);
