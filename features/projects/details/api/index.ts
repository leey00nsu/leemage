import { Project, Image } from "@/lib/generated/prisma";

// Project 모델과 연관된 Image 정보까지 포함하는 타입 정의
export type ProjectWithImages = Project & {
  images: Image[];
};

export const getProjectDetailsFn = async (
  projectId: string
): Promise<ProjectWithImages> => {
  const response = await fetch(`/api/projects/${projectId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 정보 조회에 실패했습니다.");
  }

  return response.json();
};
