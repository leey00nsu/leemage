/**
 * Property-based tests for storage quota utilities
 *
 * **Feature: storage-quota-warning**
 * **Property 2: Color determination is consistent with percentage thresholds**
 * **Property 3: Warning status is consistent with percentage thresholds**
 * **Property 4: Remaining space calculation is accurate**
 * **Validates: Requirements 2.2, 2.3, 2.4, 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getUsageColor,
  getUsageStatus,
  validateQuota,
  calculateRemainingSpace,
  calculateUsagePercentage,
  USAGE_COLORS,
  WARNING_THRESHOLD,
  CRITICAL_THRESHOLD,
} from "@/shared/lib/storage-quota-utils";

describe("Storage Quota Utilities", () => {
  describe("getUsageColor", () => {
    /**
     * Property 2: Color determination is consistent with percentage thresholds
     */
    it("should return green for percentage below 70%", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 69 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.normal);
        }),
        { numRuns: 100 }
      );
    });

    it("should return yellow for percentage between 70% and 89%", () => {
      fc.assert(
        fc.property(fc.integer({ min: 70, max: 89 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.warning);
        }),
        { numRuns: 100 }
      );
    });

    it("should return red for percentage 90% or above", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (percentage) => {
          expect(getUsageColor(percentage)).toBe(USAGE_COLORS.critical);
        }),
        { numRuns: 100 }
      );
    });

    it("should return gray for undefined percentage", () => {
      expect(getUsageColor(undefined)).toBe(USAGE_COLORS.unknown);
    });
  });

  describe("getUsageStatus", () => {
    /**
     * Property 3: Warning status is consistent with percentage thresholds
     */
    it("should return normal for percentage below 70%", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 69 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("normal");
        }),
        { numRuns: 100 }
      );
    });

    it("should return warning for percentage between 70% and 89%", () => {
      fc.assert(
        fc.property(fc.integer({ min: 70, max: 89 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("warning");
        }),
        { numRuns: 100 }
      );
    });

    it("should return critical for percentage 90% or above", () => {
      fc.assert(
        fc.property(fc.integer({ min: 90, max: 200 }), (percentage) => {
          expect(getUsageStatus(percentage)).toBe("critical");
        }),
        { numRuns: 100 }
      );
    });

    it("should return unknown for undefined percentage", () => {
      expect(getUsageStatus(undefined)).toBe("unknown");
    });
  });

  describe("validateQuota", () => {
    /**
     * Property 1: Quota validation accepts only positive numbers
     */
    it("should return true for positive numbers", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000000000000 }), (value) => {
          expect(validateQuota(value)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("should return false for zero", () => {
      expect(validateQuota(0)).toBe(false);
    });

    it("should return false for negative numbers", () => {
      fc.assert(
        fc.property(fc.integer({ min: -1000000, max: -1 }), (value) => {
          expect(validateQuota(value)).toBe(false);
        }),
        { numRuns: 50 }
      );
    });

    it("should return false for NaN", () => {
      expect(validateQuota(NaN)).toBe(false);
    });
  });

  describe("calculateRemainingSpace", () => {
    /**
     * Property 4: Remaining space calculation is accurate
     */
    it("should return quota minus usage when quota >= usage", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000000000000 }),
          fc.nat({ max: 1000000000000 }),
          (quota, usage) => {
            if (quota >= usage) {
              expect(calculateRemainingSpace(quota, usage)).toBe(quota - usage);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return 0 when usage exceeds quota", () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000000000 }),
          fc.nat({ max: 1000000000 }),
          (quota, extraUsage) => {
            const usage = quota + extraUsage + 1;
            expect(calculateRemainingSpace(quota, usage)).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("calculateUsagePercentage", () => {
    it("should return undefined when quota is 0", () => {
      expect(calculateUsagePercentage(100, 0)).toBeUndefined();
    });

    it("should return undefined when quota is undefined", () => {
      expect(calculateUsagePercentage(100, undefined)).toBeUndefined();
    });

    it("should calculate correct percentage", () => {
      expect(calculateUsagePercentage(50, 100)).toBe(50);
      expect(calculateUsagePercentage(70, 100)).toBe(70);
      expect(calculateUsagePercentage(100, 100)).toBe(100);
    });

    it("should cap at 100%", () => {
      expect(calculateUsagePercentage(150, 100)).toBe(100);
    });
  });
});
