export type StorageProviderFilter = "ALL" | "OCI" | "R2";

export interface ProjectForFilter {
  id: string;
  name: string;
  description: string | null;
  storageProvider: string;
}

export interface ProjectFilterOptions {
  searchTerm: string;
  storageProvider: StorageProviderFilter;
}

/**
 * 프로젝트 목록을 검색어와 스토리지 프로바이더로 필터링합니다.
 * - 검색어: 대소문자 구분 없이 프로젝트 이름에 포함되는지 확인
 * - 스토리지 프로바이더: "ALL"이면 모든 프로바이더, 그 외에는 해당 프로바이더만
 */
export function filterProjects<T extends ProjectForFilter>(
  projects: T[],
  options: ProjectFilterOptions
): T[] {
  const { searchTerm, storageProvider } = options;
  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  return projects.filter((project) => {
    // 검색어 필터링 (대소문자 무시)
    const matchesSearch =
      normalizedSearchTerm === "" ||
      project.name.toLowerCase().includes(normalizedSearchTerm);

    // 스토리지 프로바이더 필터링
    const matchesProvider =
      storageProvider === "ALL" || project.storageProvider === storageProvider;

    return matchesSearch && matchesProvider;
  });
}
