import { Project as PrismaProject } from "@/lib/generated/prisma";
import { FileWithVariants } from "@/entities/files/model/types";

// API 응답 타입 정의 - files 필드 사용
export type ProjectDetailsApiResponse = Omit<PrismaProject, "images"> & {
  files: FileWithVariants[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  fileCount: number;
  totalBytes: number;
  formats: string[];
};

export const getProjectDetails = async (
  projectId: string,
  query = "",
  signal?: AbortSignal,
): Promise<ProjectDetailsApiResponse> => {
  const response = await fetch(`/api/projects/${projectId}/assets?${query}`, {
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 정보 조회에 실패했습니다.");
  }

  const data = await response.json();
  return data as ProjectDetailsApiResponse;
};
