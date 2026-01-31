import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getUsageColor,
  getUsageStatus,
  validateQuota,
  calculateRemainingSpace,
  calculateUsagePercentage,
  USAGE_COLORS,
} from "@/shared/lib/storage-quota-utils";

describe("스토리지 쿼터 유틸리티", () => {
  describe("getUsageColor", () => {
    it("70% 미만에서 녹색을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 69 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.normal);
        }),
        { numRuns: 100 },
      );
    });

    it("70%~89% 사이에서 노란색을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 70, max: 89 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.warning);
        }),
        { numRuns: 100 },
      );
    });

    it("90% 이상에서 빨간색을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.critical);
        }),
        { numRuns: 100 },
      );
    });

    it("undefined일 때 회색을 반환해야 한다", () => {
      expect(getUsageColor(undefined)).toBe(USAGE_COLORS.unknown);
    });
  });

  describe("getUsageStatus", () => {
    it("70% 미만에서 normal을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 69 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("normal");
        }),
        { numRuns: 100 },
      );
    });

    it("70%~89% 사이에서 warning을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 70, max: 89 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("warning");
        }),
        { numRuns: 100 },
      );
    });

    it("90% 이상에서 critical을 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("critical");
        }),
        { numRuns: 100 },
      );
    });

    it("undefined일 때 unknown을 반환해야 한다", () => {
      expect(getUsageStatus(undefined)).toBe("unknown");
    });
  });

  describe("validateQuota", () => {
    it("양수에 대해 true를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000000000000 }), (value) => {
          expect(validateQuota(value)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("0에 대해 false를 반환해야 한다", () => {
      expect(validateQuota(0)).toBe(false);
    });

    it("음수에 대해 false를 반환해야 한다", () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000000, max: -1 }), (value) => {
          expect(validateQuota(value)).toBe(false);
        }),
        { numRuns: 50 },
      );
    });

    it("NaN에 대해 false를 반환해야 한다", () => {
      expect(validateQuota(NaN)).toBe(false);
    });
  });

  describe("calculateRemainingSpace", () => {
    it("쿼터 >= 사용량일 때 쿼터 - 사용량을 반환해야 한다", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000000000000 }),
          fc.nat({ max: 1000000000000 }),
          (quota, usage) => {
            if (quota >= usage) {
              expect(calculateRemainingSpace(quota, usage)).toBe(quota - usage);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("사용량이 쿼터 초과 시 0을 반환해야 한다", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000000000 }),
          fc.nat({ max: 1000000000 }),
          (quota, extraUsage) => {
            const usage = quota + extraUsage + 1;
            expect(calculateRemainingSpace(quota, usage)).toBe(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("calculateUsagePercentage", () => {
    it("쿼터가 0일 때 undefined를 반환해야 한다", () => {
      expect(calculateUsagePercentage(100, 0)).toBeUndefined();
    });

    it("쿼터가 undefined일 때 undefined를 반환해야 한다", () => {
      expect(calculateUsagePercentage(100, undefined)).toBeUndefined();
    });

    it("정확한 퍼센트를 계산해야 한다", () => {
      expect(calculateUsagePercentage(50, 100)).toBe(50);
      expect(calculateUsagePercentage(70, 100)).toBe(70);
      expect(calculateUsagePercentage(100, 100)).toBe(100);
    });

    it("100%로 제한해야 한다", () => {
      expect(calculateUsagePercentage(150, 100)).toBe(100);
    });
  });
});
