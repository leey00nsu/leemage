import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// API 응답과 일치하는 타입
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

// 테스트를 위해 추출한 순수 집계 함수
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
    { bytes: 0, projects: 0, files: 0 },
  );

  return { providers, total };
}

describe("스토리지 사용량 집계", () => {
  // 프로젝트 데이터 생성을 위한 Arbitrary
  const fileArb = fc.record({
    size: fc.nat({ max: 1024 * 1024 * 100 }), // 파일당 최대 100MB
  });

  const projectArb = fc.record({
    storageProvider: fc.constantFrom("OCI" as const, "R2" as const),
    files: fc.array(fileArb, { maxLength: 20 }),
  });

  it("총 바이트는 모든 파일 크기의 합과 일치해야 한다", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        // 예상 총 바이트 계산
        const expectedBytes = projects.reduce(
          (sum, p) => sum + p.files.reduce((s, f) => s + f.size, 0),
          0,
        );

        expect(result.total.bytes).toBe(expectedBytes);
      }),
      { numRuns: 100 },
    );
  });

  it("총 프로젝트 수는 프로젝트 개수와 일치해야 한다", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        expect(result.total.projects).toBe(projects.length);
      }),
      { numRuns: 100 },
    );
  });

  it("총 파일 수는 모든 파일의 합과 일치해야 한다", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        const expectedFiles = projects.reduce(
          (sum, p) => sum + p.files.length,
          0,
        );

        expect(result.total.files).toBe(expectedFiles);
      }),
      { numRuns: 100 },
    );
  });

  it("프로바이더별 합계는 전체 합계와 일치해야 한다", () => {
    fc.assert(
      fc.property(fc.array(projectArb, { maxLength: 50 }), (projects) => {
        const result = aggregateStorageUsage(projects);

        const providerBytes = result.providers.reduce(
          (sum, p) => sum + p.bytes,
          0,
        );
        const providerProjects = result.providers.reduce(
          (sum, p) => sum + p.projects,
          0,
        );
        const providerFiles = result.providers.reduce(
          (sum, p) => sum + p.files,
          0,
        );

        expect(providerBytes).toBe(result.total.bytes);
        expect(providerProjects).toBe(result.total.projects);
        expect(providerFiles).toBe(result.total.files);
      }),
      { numRuns: 100 },
    );
  });

  it("빈 프로젝트 배열에 대해 0을 반환해야 한다", () => {
    const result = aggregateStorageUsage([]);

    expect(result.providers).toHaveLength(0);
    expect(result.total.bytes).toBe(0);
    expect(result.total.projects).toBe(0);
    expect(result.total.files).toBe(0);
  });

  it("파일이 없는 프로젝트를 처리해야 한다", () => {
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
