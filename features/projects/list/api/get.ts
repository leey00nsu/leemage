import { Project } from "@/lib/generated/prisma";

export const getProjects = async (): Promise<Project[]> => {
  const response = await fetch("/api/projects");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 목록 조회에 실패했습니다.");
  }

  return response.json();
};
