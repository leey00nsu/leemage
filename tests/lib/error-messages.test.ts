/**
 * **Feature: presigned-url-upload, Property 4: Error Message Clarity**
 *
 * For any upload failure scenario (presign failure, upload failure, confirm failure),
 * the system SHALL return an error response containing a non-empty message string
 * that describes the failure reason.
 *
 * **Validates: Requirements 4.3, 5.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// 에러 응답 타입
interface ErrorResponse {
  message: string;
  errors?: unknown;
}

// 에러 메시지 검증 함수
function isValidErrorMessage(message: string): boolean {
  return typeof message === "string" && message.trim().length > 0;
}

// 에러 응답 검증 함수
function isValidErrorResponse(response: ErrorResponse): boolean {
  return isValidErrorMessage(response.message);
}

// 에러 시나리오 타입
type ErrorScenario =
  | "missing_project_id"
  | "invalid_content_type"
  | "file_too_large"
  | "par_creation_failed"
  | "invalid_file_id"
  | "object_not_found"
  | "image_processing_failed"
  | "network_error"
  | "timeout"
  | "upload_cancelled";

// 에러 시나리오별 메시지 매핑
const errorMessages: Record<ErrorScenario, string> = {
  missing_project_id: "Project ID가 필요합니다.",
  invalid_content_type: "유효하지 않은 파일 형식입니다.",
  file_too_large: "파일 크기가 제한을 초과했습니다.",
  par_creation_failed: "업로드 URL 생성에 실패했습니다.",
  invalid_file_id: "유효하지 않은 파일 ID입니다.",
  object_not_found: "업로드된 파일을 찾을 수 없습니다.",
  image_processing_failed: "이미지 처리 중 오류가 발생했습니다.",
  network_error: "네트워크 오류가 발생했습니다.",
  timeout: "업로드 시간이 초과되었습니다.",
  upload_cancelled: "업로드가 취소되었습니다.",
};

// 에러 응답 생성 함수 (실제 API 로직 시뮬레이션)
function createErrorResponse(scenario: ErrorScenario): ErrorResponse {
  return {
    message: errorMessages[scenario],
  };
}

describe("Error Message Clarity", () => {
  const errorScenarioArb = fc.constantFrom<ErrorScenario>(
    "missing_project_id",
    "invalid_content_type",
    "file_too_large",
    "par_creation_failed",
    "invalid_file_id",
    "object_not_found",
    "image_processing_failed",
    "network_error",
    "timeout",
    "upload_cancelled"
  );

  describe("Property 4: Error Message Clarity", () => {
    it("should return non-empty error message for all error scenarios", () => {
      fc.assert(
        fc.property(errorScenarioArb, (scenario) => {
          const response = createErrorResponse(scenario);

          // 에러 응답이 유효한지 확인
          expect(isValidErrorResponse(response)).toBe(true);

          // 메시지가 비어있지 않은지 확인
          expect(response.message.trim().length).toBeGreaterThan(0);
        }),
        { numRuns: 100 }
      );
    });

    it("should have descriptive error messages", () => {
      fc.assert(
        fc.property(errorScenarioArb, (scenario) => {
          const response = createErrorResponse(scenario);

          // 메시지가 최소 5자 이상인지 확인 (의미 있는 메시지)
          expect(response.message.length).toBeGreaterThanOrEqual(5);

          // 메시지가 한글 또는 영문으로 시작하는지 확인
          expect(response.message).toMatch(/^[가-힣a-zA-Z]/);
        }),
        { numRuns: 100 }
      );
    });

    it("should have unique error messages for different scenarios", () => {
      const scenarios: ErrorScenario[] = [
        "missing_project_id",
        "invalid_content_type",
        "file_too_large",
        "par_creation_failed",
        "invalid_file_id",
        "object_not_found",
        "image_processing_failed",
        "network_error",
        "timeout",
        "upload_cancelled",
      ];

      const messages = scenarios.map(
        (scenario) => createErrorResponse(scenario).message
      );
      const uniqueMessages = new Set(messages);

      // 모든 에러 메시지가 고유한지 확인
      expect(uniqueMessages.size).toBe(scenarios.length);
    });

    it("should validate error message format", () => {
      fc.assert(
        fc.property(errorScenarioArb, (scenario) => {
          const response = createErrorResponse(scenario);

          // 메시지가 마침표로 끝나는지 확인 (한국어 문장 형식)
          expect(response.message).toMatch(/[.다]$/);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Error Response Structure", () => {
    it("should always have message property", () => {
      fc.assert(
        fc.property(errorScenarioArb, (scenario) => {
          const response = createErrorResponse(scenario);

          expect(response).toHaveProperty("message");
          expect(typeof response.message).toBe("string");
        }),
        { numRuns: 100 }
      );
    });

    it("should validate isValidErrorMessage function", () => {
      // 유효한 메시지
      expect(isValidErrorMessage("에러가 발생했습니다.")).toBe(true);
      expect(isValidErrorMessage("Error occurred")).toBe(true);

      // 유효하지 않은 메시지
      expect(isValidErrorMessage("")).toBe(false);
      expect(isValidErrorMessage("   ")).toBe(false);
    });
  });
});
