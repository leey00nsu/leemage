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

/**
 * File Validator Tests
 * 
 * **Feature: security-hardening**
 * **Property 5: Path Traversal Prevention**
 * **Property 6: Filename Sanitization Idempotence**
 * **Property 7: Magic Bytes Validation Accuracy**
 * 
 * Note: Property tests cover the core security invariants.
 * Unit tests focus on specific edge cases and API behaviors.
 */

describe("File Validator", () => {
  /**
   * Property 5: Path Traversal Prevention
   * For any filename containing `../` or `..\` sequences,
   * the File_Validator SHALL reject the file with a 400 status code.
   */
  describe("Property 5: Path Traversal Prevention", () => {
    it("should reject all filenames containing path traversal sequences", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.constantFrom("../", "..\\"),
          (prefix, suffix, traversal) => {
            const fileName = `${prefix}${traversal}${suffix}`;
            const result = validateFileName(fileName);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject nested path traversal attempts", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          (depth) => {
            const traversal = "../".repeat(depth);
            const fileName = `${traversal}etc/passwd`;
            const result = validateFileName(fileName);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // containsPathTraversal: Edge cases not covered by Property 5
  describe("containsPathTraversal - edge cases", () => {
    it("should allow normal filenames with forward slashes", () => {
      expect(containsPathTraversal("folder/file.jpg")).toBe(false);
    });
  });

  // validateFileName: Edge cases not covered by property tests
  describe("validateFileName - edge cases", () => {
    it("should reject empty filenames", () => {
      const result = validateFileName("");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("파일명이 비어있습니다.");
    });

    it("should reject Windows reserved names", () => {
      const result = validateFileName("CON");
      expect(result.valid).toBe(false);
    });

    it("should reject control characters", () => {
      const result = validateFileName("file\x00name.txt");
      expect(result.valid).toBe(false);
    });

    it("should provide sanitized name for valid files", () => {
      const result = validateFileName("my file.png");
      expect(result.valid).toBe(true);
      expect(result.sanitizedName).toBe("my file.png");
    });
  });

  /**
   * Property 6: Filename Sanitization Idempotence
   * For any filename, applying sanitizeFileName twice SHALL produce
   * the same result as applying it once.
   */
  describe("Property 6: Filename Sanitization Idempotence", () => {
    it("should be idempotent for any input", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (fileName) => {
            const once = sanitizeFileName(fileName);
            const twice = sanitizeFileName(once);
            expect(twice).toBe(once);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should be idempotent for filenames with special characters", () => {
      const specialChars = [
        "a", "b", "c", ".", "-", "_", " ",
        "<", ">", '"', "'", "&", "\\", "/", ":", "*", "?", "|",
        "\x00", "\x1f"
      ];
      
      fc.assert(
        fc.property(
          fc.array(fc.constantFrom(...specialChars), { minLength: 1, maxLength: 50 }),
          (chars) => {
            const fileName = chars.join("");
            const once = sanitizeFileName(fileName);
            const twice = sanitizeFileName(once);
            expect(twice).toBe(once);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // sanitizeFileName: Edge cases not covered by Property 6
  describe("sanitizeFileName - edge cases", () => {
    it("should handle empty input", () => {
      expect(sanitizeFileName("")).toBe("");
    });

    it("should return default name when all characters are removed", () => {
      expect(sanitizeFileName("<>:")).toBe("unnamed_file");
    });
  });

  // validateContentTypeExtension: Not covered by property tests
  describe("validateContentTypeExtension", () => {
    it("should accept matching Content-Type and extension", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo.jpg")).toBe(true);
      expect(validateContentTypeExtension("image/jpeg", "photo.jpeg")).toBe(true);
      expect(validateContentTypeExtension("image/png", "image.png")).toBe(true);
    });

    it("should reject mismatched Content-Type and extension", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo.png")).toBe(false);
    });

    it("should allow files without extension", () => {
      expect(validateContentTypeExtension("image/jpeg", "photo")).toBe(true);
    });

    it("should allow unknown Content-Types", () => {
      expect(validateContentTypeExtension("application/x-custom", "file.xyz")).toBe(true);
    });

    it("should handle Content-Type with parameters", () => {
      expect(validateContentTypeExtension("image/jpeg; charset=utf-8", "photo.jpg")).toBe(true);
    });
  });

  /**
   * Property 7: Magic Bytes Validation Accuracy
   * For any image file with valid magic bytes matching its declared Content-Type,
   * the validateMagicBytes function SHALL return true.
   */
  describe("Property 7: Magic Bytes Validation Accuracy", () => {
    // Property test: valid magic bytes should always pass
    it("should always accept valid magic bytes for known types", () => {
      const testCases: Array<{ contentType: string; bytes: number[] }> = [
        { contentType: "image/jpeg", bytes: [0xFF, 0xD8, 0xFF, 0xE0] },
        { contentType: "image/png", bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
        { contentType: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
        { contentType: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] },
        { contentType: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
      ];

      for (const { contentType, bytes } of testCases) {
        const buffer = Buffer.from(bytes);
        expect(validateMagicBytes(buffer, contentType)).toBe(true);
      }
    });

    it("should reject mismatched magic bytes", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      expect(validateMagicBytes(pngBuffer, "image/jpeg")).toBe(false);
    });

    it("should allow unknown Content-Types", () => {
      const randomBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(validateMagicBytes(randomBuffer, "application/x-custom")).toBe(true);
    });

    it("should reject buffers that are too small", () => {
      const tinyBuffer = Buffer.from([0xFF, 0xD8]);
      expect(validateMagicBytes(tinyBuffer, "image/jpeg")).toBe(false);
    });
  });

  // validateFile: Integration tests
  describe("validateFile (comprehensive)", () => {
    it("should pass valid file with all checks", () => {
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      const result = validateFile("photo.jpg", "image/jpeg", jpegBuffer);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail on path traversal", () => {
      const result = validateFile("../secret.jpg", "image/jpeg");
      expect(result.valid).toBe(false);
    });

    it("should fail on Content-Type mismatch", () => {
      const result = validateFile("photo.png", "image/jpeg");
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("파일 형식이 확장자와 일치하지 않습니다.");
    });

    it("should fail on magic bytes mismatch", () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const result = validateFile("photo.jpg", "image/jpeg", pngBuffer);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("파일 내용이 선언된 형식과 일치하지 않습니다.");
    });
  });
});
