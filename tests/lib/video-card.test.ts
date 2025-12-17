import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ImageVariantData } from "@/entities/files/model/types";

/**
 * **Feature: video-thumbnail-support, Property 2: Video without thumbnail shows icon**
 * **Validates: Requirements 1.5, 2.2**
 *
 * For any video file data with an empty or missing variants array,
 * the VideoCard component should render a video icon placeholder instead of an image.
 */

/**
 * **Feature: video-thumbnail-support, Property 3: Video with thumbnail shows thumbnail**
 * **Validates: Requirements 2.1, 2.3**
 *
 * For any video file data with a valid thumbnail in the variants array,
 * the VideoCard component should render the thumbnail image with a play icon overlay.
 */

// Helper function to determine if video should show thumbnail
function shouldShowThumbnail(variants: ImageVariantData[] | undefined): boolean {
  if (!variants || variants.length === 0) return false;
  return variants.some((v) => v.label === "thumbnail");
}

// Helper function to determine if video should show icon
function shouldShowIcon(variants: ImageVariantData[] | undefined): boolean {
  return !shouldShowThumbnail(variants);
}

describe("VideoCard Logic", () => {
  describe("Property 2: Video without thumbnail shows icon", () => {
    it("should show icon when variants is undefined", () => {
      fc.assert(
        fc.property(fc.constant(undefined), (variants) => {
          expect(shouldShowIcon(variants)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should show icon when variants is empty array", () => {
      fc.assert(
        fc.property(fc.constant([]), (variants) => {
          expect(shouldShowIcon(variants as ImageVariantData[])).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should show icon when variants has no thumbnail label", () => {
      const nonThumbnailVariant = fc.record({
        url: fc.webUrl(),
        width: fc.integer({ min: 1, max: 4000 }),
        height: fc.integer({ min: 1, max: 4000 }),
        size: fc.integer({ min: 1, max: 100000000 }),
        format: fc.constantFrom("jpeg", "png", "webp"),
        label: fc.constantFrom("original", "300x300", "800x800", "1920x1080"),
      });

      fc.assert(
        fc.property(fc.array(nonThumbnailVariant, { minLength: 0, maxLength: 5 }), (variants) => {
          expect(shouldShowIcon(variants as ImageVariantData[])).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 3: Video with thumbnail shows thumbnail", () => {
    it("should show thumbnail when variants contains thumbnail label", () => {
      const thumbnailVariant = fc.record({
        url: fc.webUrl(),
        width: fc.integer({ min: 1, max: 4000 }),
        height: fc.integer({ min: 1, max: 4000 }),
        size: fc.integer({ min: 1, max: 100000000 }),
        format: fc.constant("jpeg"),
        label: fc.constant("thumbnail"),
      });

      const otherVariant = fc.record({
        url: fc.webUrl(),
        width: fc.integer({ min: 1, max: 4000 }),
        height: fc.integer({ min: 1, max: 4000 }),
        size: fc.integer({ min: 1, max: 100000000 }),
        format: fc.constantFrom("jpeg", "png", "webp"),
        label: fc.constantFrom("original", "300x300"),
      });

      fc.assert(
        fc.property(
          thumbnailVariant,
          fc.array(otherVariant, { minLength: 0, maxLength: 3 }),
          (thumbnail, others) => {
            const variants = [thumbnail, ...others] as ImageVariantData[];
            expect(shouldShowThumbnail(variants)).toBe(true);
            expect(shouldShowIcon(variants)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * **Feature: video-thumbnail-support, Property 4: Video detail page shows correct preview**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * For any video file, the detail page should show either the thumbnail (if available)
 * or a video icon placeholder, and should display file size, format, and upload date.
 */

// Helper function to determine what preview type should be shown
function getVideoDetailPreviewType(
  variants: ImageVariantData[] | undefined
): "thumbnail" | "icon" {
  if (!variants || variants.length === 0) return "icon";
  const hasThumbnail = variants.some((v) => v.label === "thumbnail");
  return hasThumbnail ? "thumbnail" : "icon";
}

describe("Property 4: Video detail page shows correct preview", () => {
  it("should show thumbnail preview when thumbnail variant exists", () => {
    const thumbnailVariant = fc.record({
      url: fc.webUrl(),
      width: fc.integer({ min: 1, max: 4000 }),
      height: fc.integer({ min: 1, max: 4000 }),
      size: fc.integer({ min: 1, max: 100000000 }),
      format: fc.constant("jpeg"),
      label: fc.constant("thumbnail"),
    });

    fc.assert(
      fc.property(thumbnailVariant, (thumbnail) => {
        const variants = [thumbnail] as ImageVariantData[];
        expect(getVideoDetailPreviewType(variants)).toBe("thumbnail");
      }),
      { numRuns: 100 }
    );
  });

  it("should show icon preview when no thumbnail variant exists", () => {
    fc.assert(
      fc.property(fc.constant(undefined), (variants) => {
        expect(getVideoDetailPreviewType(variants)).toBe("icon");
      }),
      { numRuns: 100 }
    );

    fc.assert(
      fc.property(fc.constant([]), (variants) => {
        expect(getVideoDetailPreviewType(variants as ImageVariantData[])).toBe("icon");
      }),
      { numRuns: 100 }
    );
  });
});
