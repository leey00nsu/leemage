import { CreateProjectFormValues } from "../model/schema";
import { Project } from "@/lib/generated/prisma";

export const createProject = async (
  data: CreateProjectFormValues
): Promise<Project> => {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 생성에 실패했습니다.");
  }

  return response.json();
};
