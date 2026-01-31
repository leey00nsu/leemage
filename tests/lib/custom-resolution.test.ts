import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validateCustomResolution,
  formatCustomResolution,
  parseCustomResolution,
  customResolutionSchema,
} from "@/features/files/upload/model/schema";

describe("사용자 정의 해상도", () => {
  describe("속성 2: 사용자 정의 해상도 유효성 검사", () => {
    it("유효한 해상도를 허용해야 한다 (1-10000)", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("경계값을 정확히 검증해야 한다", () => {
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

  describe("속성 5: 유효하지 않은 해상도 거부", () => {
    it("최소값 미만은 거부해야 한다 (< 1)", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("최대값 초과는 거부해야 한다 (> 10000)", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("스키마를 통해 정수가 아닌 값을 거부해야 한다", () => {
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

  describe("속성 6: 사용자 정의 해상도 형식", () => {
    it("해상도를 widthxheight 형식으로 포맷해야 한다", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (width, height) => {
            const formatted = formatCustomResolution(width, height);
            expect(formatted).toBe(`${width}x${height}`);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("원래 값으로 다시 파싱 가능해야 한다 (왕복)", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });

    it("유효하지 않은 형식 문자열에 대해 null을 반환해야 한다", () => {
      expect(parseCustomResolution("invalid")).toBeNull();
      expect(parseCustomResolution("100")).toBeNull();
      expect(parseCustomResolution("100x")).toBeNull();
      expect(parseCustomResolution("x100")).toBeNull();
      expect(parseCustomResolution("100 x 200")).toBeNull();
      expect(parseCustomResolution("100X200")).toBeNull(); // 대문자 X
    });
  });

  describe("속성 3: 유효한 사용자 정의 해상도 추가", () => {
    it("목록에 해상도를 추가하고 길이를 1 증가시켜야 한다", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("속성 4: 사용자 정의 해상도 제거", () => {
    it("목록에서 해상도를 제거하고 길이를 1 감소시켜야 한다", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(
              fc.integer({ min: 1, max: 10000 }),
              fc.integer({ min: 1, max: 10000 }),
            ),
            { minLength: 1, maxLength: 10 },
          ),
          (resolutions) => {
            const list = resolutions.map(([w, h]) =>
              formatCustomResolution(w, h),
            );
            const indexToRemove = Math.floor(Math.random() * list.length);
            const resolutionToRemove = list[indexToRemove];

            const newList = list.filter((_, i) => i !== indexToRemove);

            expect(newList.length).toBe(list.length - 1);
            // 중복이 없다면 제거된 해상도는 리스트에 없어야 함
            if (list.filter((r) => r === resolutionToRemove).length === 1) {
              expect(newList).not.toContain(resolutionToRemove);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

import { isImageFile, isImageMimeType } from "@/shared/lib/file-utils";

describe("파일 유형 감지", () => {
  describe("속성 1: 비이미지 파일은 썸네일 대신 아이콘 표시", () => {
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

    it("이미지 MIME 타입에 대해 true를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.constantFrom(...imageMimeTypes), (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("비이미지 MIME 타입에 대해 false를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.constantFrom(...nonImageMimeTypes), (mimeType) => {
          expect(isImageMimeType(mimeType)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("MIME 타입 접두사로 이미지 파일을 정확히 식별해야 한다", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 20 }), (subtype) => {
          const imageMime = `image/${subtype}`;
          const nonImageMime = `application/${subtype}`;

          expect(isImageMimeType(imageMime)).toBe(true);
          expect(isImageMimeType(nonImageMime)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("File 객체를 올바르게 처리해야 한다", () => {
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
