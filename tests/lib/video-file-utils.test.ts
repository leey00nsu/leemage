import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  isVideoMimeType,
  isVideoMimeTypeString,
  VIDEO_MIME_TYPES,
} from "@/shared/lib/file-utils";

describe("비디오 파일 유틸리티", () => {
  describe("isVideoMimeType", () => {
    it("속성 1: 'video/'로 시작하는 문자열에 대해 true를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.string(), (suffix) => {
          const mimeType = `video/${suffix}`;
          expect(isVideoMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("속성 1: 비디오가 아닌 MIME 타입에 대해 false를 반환해야 한다", () => {
      const nonVideoPrefixes = [
        "image/",
        "audio/",
        "text/",
        "application/",
        "font/",
        "model/",
        "multipart/",
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...nonVideoPrefixes),
          fc.string(),
          (prefix, suffix) => {
            const mimeType = `${prefix}${suffix}`;
            expect(isVideoMimeType(mimeType)).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("속성 1: 모든 VIDEO_MIME_TYPES에 대해 true를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.constantFrom(...VIDEO_MIME_TYPES), (mimeType) => {
          expect(isVideoMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("isVideoMimeTypeString", () => {
    it("isVideoMimeType와 동일하게 동작해야 한다", () => {
      fc.assert(
        fc.property(fc.string(), (mimeType) => {
          expect(isVideoMimeTypeString(mimeType)).toBe(
            isVideoMimeType(mimeType),
          );
        }),
        { numRuns: 100 },
      );
    });
  });
});
