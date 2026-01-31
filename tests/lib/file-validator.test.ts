import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  validateFileName,
  sanitizeFileName,
  validateContentTypeExtension,
  validateMagicBytes,
  validateFile,
  containsPathTraversal,
} from "@/lib/validation/file-validator";

describe("파일 유효성 검사기", () => {
  describe("속성 5: 경로 탐색 방지", () => {
    it("경로 탐색 시퀀스가 포함된 모든 파일명을 거부해야 한다", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.constantFrom("../", "..\\"),
          (prefix, suffix, traversal) => {
            const fileName = `${prefix}${traversal}${suffix}`;
            const result = validateFileName(fileName);
            expect(result.valid).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("중첩된 경로 탐색 시도를 거부해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 10 }), (depth) => {
          const traversal = "../".repeat(depth);
          const fileName = `${traversal}etc/passwd`;
          const result = validateFileName(fileName);
          expect(result.valid).toBe(false);
        }),
        { numRuns: 50 },
      );
    });
  });

  // containsPathTraversal: Edge cases not covered by Property 5
  describe("containsPathTraversal - 엣지 케이스", () => {
    it("슬래시가 포함된 일반 파일명을 허용해야 한다", () => {
      expect(containsPathTraversal("folder/file.jpg")).toBe(false);
    });
  });

  // validateFileName: Edge cases not covered by property tests
  describe("validateFileName - 엣지 케이스", () => {
    it("빈 파일명을 거부해야 한다", () => {
      const result = validateFileName("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("파일명이 비어있습니다.");
    });

    it("Windows 예약어를 거부해야 한다", () => {
      const result = validateFileName("CON");
      expect(result.valid).toBe(false);
    });

    it("제어 문자를 거부해야 한다", () => {
      const result = validateFileName("file\x00name.txt");
      expect(result.valid).toBe(false);
    });

    it("유효한 파일에 대해 정제된 이름을 제공해야 한다", () => {
      const result = validateFileName("my file.png");
      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBe("my file.png");
    });
  });

  describe("속성 6: 파일명 정제 멱등성", () => {
    it("모든 입력에 대해 멱등적이어야 한다", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1, maxLength: 100 }), (fileName) => {
          const once = sanitizeFileName(fileName);
          const twice = sanitizeFileName(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 100 },
      );
    });

    it("특수 문자가 포함된 파일명에 대해 멱등적이어야 한다", () => {
      const specialChars = [
        "a",
        "b",
        "c",
        ".",
        "-",
        "_",
        " ",
        "<",
        ">",
        '"',
        "'",
        "&",
        "\\",
        "/",
        ":",
        "*",
        "?",
        "|",
        "\x00",
        "\x1f",
      ];

      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...specialChars), {
            minLength: 1,
            maxLength: 50,
          }),
          (chars) => {
            const fileName = chars.join("");
            const once = sanitizeFileName(fileName);
            const twice = sanitizeFileName(once);
            expect(twice).toBe(once);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // sanitizeFileName: Edge cases not covered by Property 6
  describe("sanitizeFileName - 엣지 케이스", () => {
    it("빈 입력을 처리해야 한다", () => {
      expect(sanitizeFileName("")).toBe("");
    });

    it("모든 문자가 제거된 경우 기본 이름을 반환해야 한다", () => {
      expect(sanitizeFileName("<>:")).toBe("unnamed_file");
    });
  });

  // validateContentTypeExtension: Not covered by property tests
  describe("validateContentTypeExtension", () => {
    it("일치하는 Content-Type과 확장자를 허용해야 한다", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo.jpg")).toBe(
        true,
      );
      expect(validateContentTypeExtension("image/jpeg", "photo.jpeg")).toBe(
        true,
      );
      expect(validateContentTypeExtension("image/png", "image.png")).toBe(true);
    });

    it("일치하지 않는 Content-Type과 확장자를 거부해야 한다", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo.png")).toBe(
        false,
      );
    });

    it("확장자가 없는 파일을 허용해야 한다", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo")).toBe(true);
    });

    it("알 수 없는 Content-Type을 허용해야 한다", () => {
      expect(
        validateContentTypeExtension("application/x-custom", "file.xyz"),
      ).toBe(true);
    });

    it("파라미터가 포함된 Content-Type을 처리해야 한다", () => {
      expect(
        validateContentTypeExtension("image/jpeg; charset=utf-8", "photo.jpg"),
      ).toBe(true);
    });
  });

  describe("속성 7: 매직 바이트 검증 정확성", () => {
    // Property test: valid magic bytes should always pass
    it("알려진 유형에 대해 항상 유효한 매직 바이트를 허용해야 한다", () => {
      const testCases: Array<{ contentType: string; bytes: number[] }> = [
        { contentType: "image/jpeg", bytes: [0xff, 0xd8, 0xff, 0xe0] },
        {
          contentType: "image/png",
          bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
        },
        {
          contentType: "image/gif",
          bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
        },
        { contentType: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
        { contentType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
      ];

      for (const { contentType, bytes } of testCases) {
        const buffer = Buffer.from(bytes);
        expect(validateMagicBytes(buffer, contentType)).toBe(true);
      }
    });

    it("일치하지 않는 매직 바이트를 거부해야 한다", () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      expect(validateMagicBytes(pngBuffer, "image/jpeg")).toBe(false);
    });

    it("알 수 없는 Content-Type을 허용해야 한다", () => {
      const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(validateMagicBytes(randomBuffer, "application/x-custom")).toBe(
        true,
      );
    });

    it("너무 작은 버퍼를 거부해야 한다", () => {
      const tinyBuffer = Buffer.from([0xff, 0xd8]);
      expect(validateMagicBytes(tinyBuffer, "image/jpeg")).toBe(false);
    });
  });

  // validateFile: Integration tests
  describe("validateFile (종합)", () => {
    it("모든 검사를 통과하는 유효한 파일이어야 한다", () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      const result = validateFile("photo.jpg", "image/jpeg", jpegBuffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("경로 탐색에 실패해야 한다", () => {
      const result = validateFile("../secret.jpg", "image/jpeg");
      expect(result.valid).toBe(false);
    });

    it("Content-Type 불일치에 실패해야 한다", () => {
      const result = validateFile("photo.png", "image/jpeg");

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "파일 형식이 확장자와 일치하지 않습니다.",
      );
    });

    it("매직 바이트 불일치에 실패해야 한다", () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const result = validateFile("photo.jpg", "image/jpeg", pngBuffer);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "파일 내용이 선언된 형식과 일치하지 않습니다.",
      );
    });
  });
});
