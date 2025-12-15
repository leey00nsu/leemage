import { Project as PrismaProject } from "@/lib/generated/prisma";
import { FileWithVariants, ImageVariantData } from "@/entities/files";

// API 응답 타입 정의 - files 필드 사용
export type ProjectDetailsApiResponse = Omit<PrismaProject, "images"> & {
  files: FileWithVariants[];
};

export const getProjectDetails = async (
  projectId: string
): Promise<ProjectDetailsApiResponse> => {
  const response = await fetch(`/api/projects/${projectId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 정보 조회에 실패했습니다.");
  }

  const data = await response.json();
  return data as ProjectDetailsApiResponse;
};
