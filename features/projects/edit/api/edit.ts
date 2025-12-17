import { EditProjectFormValues } from "../model/schema";

export interface UpdateProjectResponse {
  id: string;
  name: string;
  description: string | null;
  storageProvider: string;
  createdAt: string;
  updatedAt: string;
}

export const updateProject = async (
  projectId: string,
  data: EditProjectFormValues
): Promise<UpdateProjectResponse> => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "프로젝트 수정에 실패했습니다.");
  }

  return response.json();
};
