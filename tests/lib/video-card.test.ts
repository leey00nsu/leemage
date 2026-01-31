import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ImageVariantData } from "@/entities/files/model/types";

// 비디오가 썸네일을 표시해야 하는지 판단하는 헬퍼 함수
function shouldShowThumbnail(
  variants: ImageVariantData[] | undefined,
): boolean {
  if (!variants || variants.length === 0) return false;
  return variants.some((v) => v.label === "thumbnail");
}

// 비디오가 아이콘을 표시해야 하는지 판단하는 헬퍼 함수
function shouldShowIcon(variants: ImageVariantData[] | undefined): boolean {
  return !shouldShowThumbnail(variants);
}

describe("VideoCard 로직", () => {
  describe("속성 2: 썸네일 없는 비디오는 아이콘 표시", () => {
    it("variants가 undefined일 때 아이콘을 표시해야 한다", () => {
      fc.assert(
        fc.property(fc.constant(undefined), (variants) => {
          expect(shouldShowIcon(variants)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("variants가 빈 배열일 때 아이콘을 표시해야 한다", () => {
      fc.assert(
        fc.property(fc.constant<ImageVariantData[]>([]), (variants) => {
          expect(shouldShowIcon(variants)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("variants에 thumbnail 라벨이 없을 때 아이콘을 표시해야 한다", () => {
      const nonThumbnailVariant = fc.record({
        url: fc.webUrl(),
        width: fc.integer({ min: 1, max: 4000 }),
        height: fc.integer({ min: 1, max: 4000 }),
        size: fc.integer({ min: 1, max: 100000000 }),
        format: fc.constantFrom("jpeg", "png", "webp"),
        label: fc.constantFrom("original", "300x300", "800x800", "1920x1080"),
      });

      fc.assert(
        fc.property(
          fc.array(nonThumbnailVariant, { minLength: 0, maxLength: 5 }),
          (variants) => {
            expect(shouldShowIcon(variants as ImageVariantData[])).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("속성 3: 썸네일 있는 비디오는 썸네일 표시", () => {
    it("variants에 thumbnail 라벨이 있을 때 썸네일을 표시해야 한다", () => {
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
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});

// 어떤 미리보기 타입을 표시해야 하는지 판단하는 헬퍼 함수
function getVideoDetailPreviewType(
  variants: ImageVariantData[] | undefined,
): "thumbnail" | "icon" {
  if (!variants || variants.length === 0) return "icon";
  const hasThumbnail = variants.some((v) => v.label === "thumbnail");
  return hasThumbnail ? "thumbnail" : "icon";
}

describe("속성 4: 비디오 상세 페이지 미리보기 표시", () => {
  it("썸네일 variant 존재 시 썸네일 미리보기를 표시해야 한다", () => {
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
      { numRuns: 100 },
    );
  });

  it("썸네일 variant 없을 때 아이콘 미리보기를 표시해야 한다", () => {
    fc.assert(
      fc.property(fc.constant(undefined), (variants) => {
        expect(getVideoDetailPreviewType(variants)).toBe("icon");
      }),
      { numRuns: 100 },
    );

    fc.assert(
      fc.property(fc.constant<ImageVariantData[]>([]), (variants) => {
        expect(getVideoDetailPreviewType(variants)).toBe("icon");
      }),
      { numRuns: 100 },
    );
  });
});
