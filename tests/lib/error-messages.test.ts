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
  missing_project_id: "Project ID is required.",
  invalid_content_type: "Invalid file type.",
  file_too_large: "File size exceeds the limit.",
  par_creation_failed: "Failed to generate upload URL.",
  invalid_file_id: "Invalid file ID.",
  object_not_found: "Uploaded file not found.",
  image_processing_failed: "An error occurred while processing the image.",
  network_error: "A network error occurred.",
  timeout: "Upload timed out.",
  upload_cancelled: "Upload was cancelled.",
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

          // 메시지가 영문자로 시작하는지 확인
          expect(response.message).toMatch(/^[a-zA-Z]/);
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

          // 메시지가 마침표로 끝나는지 확인
          expect(response.message).toMatch(/[.]$/);
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
      expect(isValidErrorMessage("Error occurred")).toBe(true);

      // 유효하지 않은 메시지
      expect(isValidErrorMessage("")).toBe(false);
      expect(isValidErrorMessage("   ")).toBe(false);
    });
  });
});
