/**
 * Project Update Property Tests
 *
 * **Feature: project-management-enhancements, Property 1: Project Update Persistence**
 * **Feature: project-management-enhancements, Property 2: Empty Name Rejection**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { updateProjectRequestSchema } from "@/lib/openapi/schemas/projects";

describe("Project Update", () => {
  /**
   * **Feature: project-management-enhancements, Property 1: Project Update Persistence**
   * *For any* valid project update (name or description), the schema should accept the input.
   * **Validates: Requirements 1.2, 1.3**
   */
  describe("Property 1: Project Update Persistence", () => {
    it("should accept valid project name updates", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          (name) => {
            const result = updateProjectRequestSchema.safeParse({ name });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept valid project description updates", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 200 }),
          (description) => {
            const result = updateProjectRequestSchema.safeParse({ description });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should accept valid combined name and description updates", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 0, maxLength: 200 }),
          (name, description) => {
            const result = updateProjectRequestSchema.safeParse({ name, description });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: project-management-enhancements, Property 2: Empty Name Rejection**
   * *For any* string composed entirely of whitespace characters, the schema should reject it.
   * **Validates: Requirements 1.4**
   */
  describe("Property 2: Empty Name Rejection", () => {
    it("should reject empty string as project name", () => {
      const result = updateProjectRequestSchema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });

    it("should reject names exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (name) => {
            const result = updateProjectRequestSchema.safeParse({ name });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject descriptions exceeding max length", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 201, maxLength: 300 }),
          (description) => {
            const result = updateProjectRequestSchema.safeParse({ description });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
