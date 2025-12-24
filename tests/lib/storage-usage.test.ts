/**
 * Property-based tests for storage usage aggregation
 *
 * **Feature: storage-usage-display, Property 2: Storage usage aggregation is consistent**
 * **Validates: Requirements 1.2, 2.1, 2.2**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// Types matching the API response
interface StorageProviderUsage {
  provider: "OCI" | "R2";
  bytes: number;
  projects: number;
  files: number;
}

interface ProjectData {
  storageProvider: "OCI" | "R2";
  files: { size: number }[];
}

// Pure aggregation function extracted for testing
function aggregateStorageUsage(projects: ProjectData[]): {
  providers: StorageProviderUsage[];
  total: { bytes: number; projects: number; files: number };
} {
  const usageMap = new Map<string, StorageProviderUsage>();

  for (const project of projects) {
    const provider = project.storageProvider;
    const existing = usageMap.get(provider) || {
      provider,
      bytes: 0,
      projects: 0,
      files: 0,
    };

    existing.projects += 1;
    existing.files += project.files.length;
    existing.bytes += project.files.reduce((sum, f) => sum + f.size, 0);

    usageMap.set(provider, existing);
  }

  const providers = Array.from(usageMap.values());

  const total = providers.reduce(
    (acc, p) => ({
      bytes: acc.bytes + p.bytes,
      projects: acc.projects + p.projects,
      files: acc.files + p.files,
    }),
    { bytes: 0, projects: 0, files: 0 }
  );

  return { providers, total };
}

describe("Storage Usage Aggregation", () => {
  // Arbitrary for generating project data
  const fileArb = fc.record({
    size: fc.nat({ max: 1024 * 1024 * 100 }), // Up to 100MB per file
  });

  const projectArb = fc.record({
    storageProvider: fc.constantFrom("OCI" as const, "R2" as const),
    files: fc.array(fileArb, { maxLength: 20 }),
  });

  /**
   * Property 2: Total bytes equals sum of all file sizes
   */
  it("should have total bytes equal to sum of all file sizes", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        // Calculate expected total bytes
        const expectedBytes = projects.reduce(
          (sum, p) => sum + p.files.reduce((s, f) => s + f.size, 0),
          0
        );

        expect(result.total.bytes).toBe(expectedBytes);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Total projects equals number of projects
   */
  it("should have total projects equal to number of projects", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        expect(result.total.projects).toBe(projects.length);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Total files equals sum of all files across projects
   */
  it("should have total files equal to sum of all files", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        const expectedFiles = projects.reduce((sum, p) => sum + p.files.length, 0);

        expect(result.total.files).toBe(expectedFiles);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: Provider totals sum to overall total
   */
  it("should have provider totals sum to overall total", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        const providerBytes = result.providers.reduce((sum, p) => sum + p.bytes, 0);
        const providerProjects = result.providers.reduce((sum, p) => sum + p.projects, 0);
        const providerFiles = result.providers.reduce((sum, p) => sum + p.files, 0);

        expect(providerBytes).toBe(result.total.bytes);
        expect(providerProjects).toBe(result.total.projects);
        expect(providerFiles).toBe(result.total.files);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Edge case: Empty projects array
   */
  it("should return zeros for empty projects", () => {
    const result = aggregateStorageUsage([]);

    expect(result.providers).toHaveLength(0);
    expect(result.total.bytes).toBe(0);
    expect(result.total.projects).toBe(0);
    expect(result.total.files).toBe(0);
  });

  /**
   * Edge case: Projects with no files
   */
  it("should handle projects with no files", () => {
    const projects: ProjectData[] = [
      { storageProvider: "OCI", files: [] },
      { storageProvider: "R2", files: [] },
    ];

    const result = aggregateStorageUsage(projects);

    expect(result.total.bytes).toBe(0);
    expect(result.total.projects).toBe(2);
    expect(result.total.files).toBe(0);
  });
});
