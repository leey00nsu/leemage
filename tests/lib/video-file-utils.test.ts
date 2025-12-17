import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  isVideoMimeType,
  isVideoMimeTypeString,
  VIDEO_MIME_TYPES,
} from "@/shared/lib/file-utils";

/**
 * **Feature: video-thumbnail-support, Property 1: Video file identification**
 * **Validates: Requirements 1.1, 2.1**
 *
 * For any MIME type string, isVideoMimeType should return true if and only if
 * the MIME type starts with "video/"
 */
describe("Video File Utilities", () => {
  describe("isVideoMimeType", () => {
    it("Property 1: should return true for any string starting with 'video/'", () => {
      fc.assert(
        fc.property(fc.string(), (suffix) => {
          const mimeType = `video/${suffix}`;
          expect(isVideoMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("Property 1: should return false for non-video MIME types", () => {
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
          }
        ),
        { numRuns: 100 }
      );
    });

    it("Property 1: should return true for all known VIDEO_MIME_TYPES", () => {
      fc.assert(
        fc.property(fc.constantFrom(...VIDEO_MIME_TYPES), (mimeType) => {
          expect(isVideoMimeType(mimeType)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("isVideoMimeTypeString", () => {
    it("should behave identically to isVideoMimeType", () => {
      fc.assert(
        fc.property(fc.string(), (mimeType) => {
          expect(isVideoMimeTypeString(mimeType)).toBe(isVideoMimeType(mimeType));
        }),
        { numRuns: 100 }
      );
    });
  });
});
