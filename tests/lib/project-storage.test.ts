/**
 * Project Storage Provider Unit Tests
 * 
 * **Feature: multi-storage-provider, Property 1: Default Storage Provider**
 * **Feature: multi-storage-provider, Property 2: Storage Provider Persistence Round-Trip**
 * **Validates: Requirements 1.2, 1.3**
 */

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createProjectRequestSchema } from "@/lib/openapi/schemas/projects";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "@/lib/storage/types";

describe("Project Storage Provider", () => {
  describe("createProjectRequestSchema", () => {
    it("should default to OCI when storageProvider is not provided", () => {
      const input = {
        name: "Test Project",
        description: "Test description",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.OCI);
      expect(result.storageProvider).toBe(DEFAULT_STORAGE_PROVIDER);
    });

    it("should accept OCI as storageProvider", () => {
      const input = {
        name: "Test Project",
        storageProvider: "OCI",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.OCI);
    });

    it("should accept R2 as storageProvider", () => {
      const input = {
        name: "Test Project",
        storageProvider: "R2",
      };

      const result = createProjectRequestSchema.parse(input);

      expect(result.storageProvider).toBe(StorageProvider.R2);
    });

    it("should reject invalid storageProvider values", () => {
      const input = {
        name: "Test Project",
        storageProvider: "INVALID",
      };

      expect(() => createProjectRequestSchema.parse(input)).toThrow();
    });

    it("should preserve storageProvider through parse (round-trip)", () => {
      const providers = [StorageProvider.OCI, StorageProvider.R2];

      providers.forEach((provider) => {
        const input = {
          name: "Test Project",
          storageProvider: provider,
        };

        const result = createProjectRequestSchema.parse(input);
        expect(result.storageProvider).toBe(provider);
      });
    });
  });

  describe("Schema validation", () => {
    it("should validate name length constraints", () => {
      // Too short
      expect(() =>
        createProjectRequestSchema.parse({
          name: "ab",
          storageProvider: "OCI",
        })
      ).toThrow();

      // Valid length
      const validResult = createProjectRequestSchema.parse({
        name: "Valid Name",
        storageProvider: "OCI",
      });
      expect(validResult.name).toBe("Valid Name");
    });

    it("should validate description length constraints", () => {
      const longDescription = "a".repeat(201);

      expect(() =>
        createProjectRequestSchema.parse({
          name: "Test Project",
          description: longDescription,
          storageProvider: "OCI",
        })
      ).toThrow();
    });
  });
});
