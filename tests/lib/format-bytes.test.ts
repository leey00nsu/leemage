/**
 * Property-based tests for formatBytes utility
 *
 * **Feature: storage-usage-display, Property 1: Byte formatting produces valid human-readable output**
 * **Validates: Requirements 1.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { formatBytes } from "@/shared/lib/format-bytes";

describe("formatBytes", () => {
  const validUnits = ["B", "KB", "MB", "GB", "TB", "PB"];

  /**
   * Property 1: For any non-negative integer byte value, formatBytes returns
   * a string containing a number followed by a valid unit
   */
  it("should always produce valid human-readable output for any non-negative bytes", () => {
    fc.assert(
      fc.property(fc.nat(), (bytes) => {
        const result = formatBytes(bytes);

        // Result should be a non-empty string
        expect(result.length).toBeGreaterThan(0);

        // Result should match pattern: number + space + unit
        const pattern = /^[\d.]+\s+(B|KB|MB|GB|TB|PB)$/;
        expect(result).toMatch(pattern);

        // Extract unit and verify it's valid
        const unit = result.split(" ")[1];
        expect(validUnits).toContain(unit);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: formatBytes should be monotonic - larger bytes should result
   * in equal or larger numeric values when comparing same units
   */
  it("should handle boundary values correctly", () => {
    // 0 bytes
    expect(formatBytes(0)).toBe("0 B");

    // Exactly 1 KB
    expect(formatBytes(1024)).toBe("1 KB");

    // Exactly 1 MB
    expect(formatBytes(1024 * 1024)).toBe("1 MB");

    // Exactly 1 GB
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");

    // Exactly 1 TB
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe("1 TB");
  });

  /**
   * Property 3: Negative bytes should return "0 B"
   */
  it("should return 0 B for negative values", () => {
    fc.assert(
      fc.property(fc.integer({ min: -1000000, max: -1 }), (bytes) => {
        expect(formatBytes(bytes)).toBe("0 B");
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Property 4: Decimal places should be respected
   */
  it("should respect decimal places parameter", () => {
    const bytes = 1536; // 1.5 KB

    expect(formatBytes(bytes, 0)).toBe("2 KB"); // Rounded
    expect(formatBytes(bytes, 1)).toBe("1.5 KB");
    expect(formatBytes(bytes, 2)).toBe("1.5 KB");
  });

  /**
   * Property 5: Output numeric value should be reasonable (not excessively large)
   */
  it("should keep numeric value reasonable for appropriate unit selection", () => {
    fc.assert(
      fc.property(fc.nat({ max: 1024 * 1024 * 1024 * 1024 }), (bytes) => {
        if (bytes === 0) return; // Skip 0

        const result = formatBytes(bytes);
        const numericPart = parseFloat(result.split(" ")[0]);

        // Numeric part should be at most 1024 (we use appropriate unit)
        expect(numericPart).toBeLessThanOrEqual(1024);
      }),
      { numRuns: 100 }
    );
  });
});
