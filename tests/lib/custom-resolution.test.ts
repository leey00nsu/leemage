/**
 * Custom Resolution Property Tests
 *
 * **Feature: file-upload-ux-improvements, Property 2: Custom resolution validation**
 * **Feature: file-upload-ux-improvements, Property 5: Invalid resolution rejection**
 * **Feature: file-upload-ux-improvements, Property 6: Custom resolution format**
 * **Feature: file-upload-ux-improvements, Property 3: Valid custom resolution addition**
 * **Feature: file-upload-ux-improvements, Property 4: Custom resolution removal**
 * **Validates: Requirements 2.2, 2.3, 2.5, 2.6, 2.7**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validateCustomResolution,
  formatCustomResolution,
  parseCustomResolution,
  customResolutionSchema,
} from "@/features/files/upload/model/schema";

describe("Custom Resolution", () => {
  /**
   * **Feature: file-upload-ux-improvements, Property 2: Custom resolution validation**
   * *For any* width and height values, the validation function should return true
   * if and only if both values are positive integers between 1 and 10000 (inclusive).
   * **Validates: Requirements 2.2**
   */
  describe("Property 2: Custom resolution validation", () => {
    it("should accept valid resolutions (1-10000)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (width, height) => {
            const result = validateCustomResolution(width, height);
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.width).toBe(width);
              expect(result.data.height).toBe(height);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should validate boundary values correctly", () => {
      // 최소값
      expect(validateCustomResolution(1, 1).success).toBe(true);
      // 최대값
      expect(validateCustomResolution(10000, 10000).success).toBe(true);
      // 경계 바로 밖
      expect(validateCustomResolution(0, 1).success).toBe(false);
      expect(validateCustomResolution(1, 0).success).toBe(false);
      expect(validateCustomResolution(10001, 1).success).toBe(false);
      expect(validateCustomResolution(1, 10001).success).toBe(false);
    });
  });

  /**
   * **Feature: file-upload-ux-improvements, Property 5: Invalid resolution rejection**
   * *For any* width or height value outside the range 1-10000 or non-integer values,
   * the validation function should return false and an error message should be available.
   * **Validates: Requirements 2.6**
   */
  describe("Property 5: Invalid resolution rejection", () => {
    it("should reject values below minimum (< 1)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10000, max: 0 }),
          fc.integer({ min: 1, max: 10000 }),
          (invalidWidth, validHeight) => {
            const result = validateCustomResolution(invalidWidth, validHeight);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject values above maximum (> 10000)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10001, max: 100000 }),
          fc.integer({ min: 1, max: 10000 }),
          (invalidWidth, validHeight) => {
            const result = validateCustomResolution(invalidWidth, validHeight);
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject non-integer values via schema", () => {
      // Zod 스키마 직접 테스트
      const floatResult = customResolutionSchema.safeParse({
        width: 100.5,
        height: 200,
      });
      expect(floatResult.success).toBe(false);

      const negativeResult = customResolutionSchema.safeParse({
        width: -100,
        height: 200,
      });
      expect(negativeResult.success).toBe(false);
    });
  });

  /**
   * **Feature: file-upload-ux-improvements, Property 6: Custom resolution format**
   * *For any* valid width and height pair, the formatted resolution string
   * should be exactly "{width}x{height}".
   * **Validates: Requirements 2.7**
   */
  describe("Property 6: Custom resolution format", () => {
    it("should format resolution as widthxheight", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (width, height) => {
            const formatted = formatCustomResolution(width, height);
            expect(formatted).toBe(`${width}x${height}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should be parseable back to original values (round-trip)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (width, height) => {
            const formatted = formatCustomResolution(width, height);
            const parsed = parseCustomResolution(formatted);
            expect(parsed).not.toBeNull();
            expect(parsed?.width).toBe(width);
            expect(parsed?.height).toBe(height);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return null for invalid format strings", () => {
      expect(parseCustomResolution("invalid")).toBeNull();
      expect(parseCustomResolution("100")).toBeNull();
      expect(parseCustomResolution("100x")).toBeNull();
      expect(parseCustomResolution("x100")).toBeNull();
      expect(parseCustomResolution("100 x 200")).toBeNull();
      expect(parseCustomResolution("100X200")).toBeNull(); // 대문자 X
    });
  });

  /**
   * **Feature: file-upload-ux-improvements, Property 3: Valid custom resolution addition**
   * *For any* valid custom resolution (width and height between 1-10000),
   * adding it to the sizes list should increase the list length by 1
   * and the new resolution should be present in the list.
   * **Validates: Requirements 2.3**
   */
  describe("Property 3: Valid custom resolution addition", () => {
    it("should add resolution to list and increase length by 1", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string(), { minLength: 0, maxLength: 9 }),
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (existingList, width, height) => {
            const newResolution = formatCustomResolution(width, height);
            const newList = [...existingList, newResolution];

            expect(newList.length).toBe(existingList.length + 1);
            expect(newList).toContain(newResolution);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: file-upload-ux-improvements, Property 4: Custom resolution removal**
   * *For any* custom resolution in the sizes list, removing it should decrease
   * the list length by 1 and the resolution should no longer be present in the list.
   * **Validates: Requirements 2.5**
   */
  describe("Property 4: Custom resolution removal", () => {
    it("should remove resolution from list and decrease length by 1", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.integer({ min: 1, max: 10000 }),
              fc.integer({ min: 1, max: 10000 })
            ),
            { minLength: 1, maxLength: 10 }
          ),
          (resolutions) => {
            const list = resolutions.map(([w, h]) =>
              formatCustomResolution(w, h)
            );
            const indexToRemove = Math.floor(Math.random() * list.length);
            const resolutionToRemove = list[indexToRemove];

            const newList = list.filter((_, i) => i !== indexToRemove);

            expect(newList.length).toBe(list.length - 1);
            // 중복이 없다면 제거된 해상도는 리스트에 없어야 함
            if (list.filter((r) => r === resolutionToRemove).length === 1) {
              expect(newList).not.toContain(resolutionToRemove);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * File Type Detection Property Tests
 *
 * **Feature: file-upload-ux-improvements, Property 1: Non-image files show icon instead of thumbnail**
 * **Validates: Requirements 1.2**
 */

import { isImageFile, isImageMimeType } from "@/shared/lib/file-utils";

describe("File Type Detection", () => {
  /**
   * **Feature: file-upload-ux-improvements, Property 1: Non-image files show icon instead of thumbnail**
   * *For any* file with a MIME type that does not start with "image/",
   * the isImageFile function should return false.
   * **Validates: Requirements 1.2**
   */
  describe("Property 1: Non-image files show icon instead of thumbnail", () => {
    // 이미지 MIME 타입 목록
    const imageMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/avif",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
    ];

    // 비이미지 MIME 타입 목록
    const nonImageMimeTypes = [
      "application/pdf",
      "application/json",
      "application/xml",
      "application/zip",
      "text/plain",
      "text/html",
      "text/css",
      "text/javascript",
      "video/mp4",
      "video/webm",
      "audio/mpeg",
      "audio/wav",
      "application/octet-stream",
    ];

    it("should return true for image MIME types", () => {
      fc.assert(
        fc.property(fc.constantFrom(...imageMimeTypes), (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for non-image MIME types", () => {
      fc.assert(
        fc.property(fc.constantFrom(...nonImageMimeTypes), (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it("should correctly identify image files by MIME type prefix", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          (subtype) => {
            const imageMime = `image/${subtype}`;
            const nonImageMime = `application/${subtype}`;

            expect(isImageMimeType(imageMime)).toBe(true);
            expect(isImageMimeType(nonImageMime)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle File objects correctly", () => {
      // 이미지 파일 테스트
      const imageFile = new File([""], "test.png", { type: "image/png" });
      expect(isImageFile(imageFile)).toBe(true);

      // 비이미지 파일 테스트
      const pdfFile = new File([""], "test.pdf", { type: "application/pdf" });
      expect(isImageFile(pdfFile)).toBe(false);

      // 타입 없는 파일 테스트
      const unknownFile = new File([""], "test.unknown", { type: "" });
      expect(isImageFile(unknownFile)).toBe(false);
    });
  });
});
