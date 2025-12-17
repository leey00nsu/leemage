/**
 * Project Filter Property Tests
 *
 * **Feature: project-management-enhancements, Property 3: Search Filter Correctness**
 * **Feature: project-management-enhancements, Property 4: Combined Filter Correctness**
 * **Validates: Requirements 2.1, 2.4, 3.1, 3.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  filterProjects,
  ProjectForFilter,
  StorageProviderFilter,
} from "@/features/projects/list/model/filter";

// 테스트용 프로젝트 생성 헬퍼
const createProject = (
  id: string,
  name: string,
  storageProvider: "OCI" | "R2"
): ProjectForFilter => ({
  id,
  name,
  description: null,
  storageProvider,
});

// 프로젝트 arbitrary 생성
const projectArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  storageProvider: fc.constantFrom("OCI", "R2"),
});

const projectListArbitrary = fc.array(projectArbitrary, {
  minLength: 0,
  maxLength: 20,
});

const storageProviderFilterArbitrary = fc.constantFrom<StorageProviderFilter>(
  "ALL",
  "OCI",
  "R2"
);

describe("Project Filter", () => {
  /**
   * **Feature: project-management-enhancements, Property 3: Search Filter Correctness**
   * *For any* search term, all projects displayed in the filtered list should contain
   * that search term (case-insensitive) in their name.
   * **Validates: Requirements 2.1, 2.4**
   */
  describe("Property 3: Search Filter Correctness", () => {
    it("should return all projects when search term is empty", () => {
      fc.assert(
        fc.property(projectListArbitrary, (projects) => {
          const result = filterProjects(projects, {
            searchTerm: "",
            storageProvider: "ALL",
          });
          expect(result.length).toBe(projects.length);
        }),
        { numRuns: 100 }
      );
    });

    it("should filter projects case-insensitively by name", () => {
      fc.assert(
        fc.property(
          projectListArbitrary,
          fc.string({ minLength: 1, maxLength: 10 }).filter((s) => s.trim().length > 0),
          (projects, searchTerm) => {
            const result = filterProjects(projects, {
              searchTerm,
              storageProvider: "ALL",
            });

            // 모든 결과는 검색어를 포함해야 함 (대소문자 무시)
            const normalizedSearch = searchTerm.toLowerCase().trim();
            result.forEach((project) => {
              expect(project.name.toLowerCase()).toContain(normalizedSearch);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should find projects regardless of search term case", () => {
      const projects = [
        createProject("1", "My Project", "OCI"),
        createProject("2", "Another Project", "R2"),
        createProject("3", "TEST PROJECT", "OCI"),
      ];

      // 소문자 검색
      const lowerResult = filterProjects(projects, {
        searchTerm: "project",
        storageProvider: "ALL",
      });
      expect(lowerResult.length).toBe(3);

      // 대문자 검색
      const upperResult = filterProjects(projects, {
        searchTerm: "PROJECT",
        storageProvider: "ALL",
      });
      expect(upperResult.length).toBe(3);

      // 혼합 검색
      const mixedResult = filterProjects(projects, {
        searchTerm: "PrOjEcT",
        storageProvider: "ALL",
      });
      expect(mixedResult.length).toBe(3);
    });
  });

  /**
   * **Feature: project-management-enhancements, Property 4: Combined Filter Correctness**
   * *For any* combination of search term and storage provider filter, all displayed projects
   * should satisfy both conditions.
   * **Validates: Requirements 3.1, 3.3**
   */
  describe("Property 4: Combined Filter Correctness", () => {
    it("should filter by storage provider when ALL is not selected", () => {
      fc.assert(
        fc.property(
          projectListArbitrary,
          fc.constantFrom<"OCI" | "R2">("OCI", "R2"),
          (projects, provider) => {
            const result = filterProjects(projects, {
              searchTerm: "",
              storageProvider: provider,
            });

            // 모든 결과는 선택된 프로바이더여야 함
            result.forEach((project) => {
              expect(project.storageProvider).toBe(provider);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return all providers when ALL is selected", () => {
      const projects = [
        createProject("1", "Project A", "OCI"),
        createProject("2", "Project B", "R2"),
        createProject("3", "Project C", "OCI"),
      ];

      const result = filterProjects(projects, {
        searchTerm: "",
        storageProvider: "ALL",
      });

      expect(result.length).toBe(3);
    });

    it("should apply both search and provider filter together", () => {
      fc.assert(
        fc.property(
          projectListArbitrary,
          fc.string({ minLength: 0, maxLength: 10 }),
          storageProviderFilterArbitrary,
          (projects, searchTerm, provider) => {
            const result = filterProjects(projects, {
              searchTerm,
              storageProvider: provider,
            });

            const normalizedSearch = searchTerm.toLowerCase().trim();

            result.forEach((project) => {
              // 검색어 조건 확인
              if (normalizedSearch !== "") {
                expect(project.name.toLowerCase()).toContain(normalizedSearch);
              }

              // 프로바이더 조건 확인
              if (provider !== "ALL") {
                expect(project.storageProvider).toBe(provider);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should return empty array when no projects match both conditions", () => {
      const projects = [
        createProject("1", "Alpha", "OCI"),
        createProject("2", "Beta", "R2"),
      ];

      const result = filterProjects(projects, {
        searchTerm: "Gamma",
        storageProvider: "OCI",
      });

      expect(result.length).toBe(0);
    });
  });
});
