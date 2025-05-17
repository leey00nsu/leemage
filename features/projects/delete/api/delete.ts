export const deleteProject = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || "프로젝트 삭제 중 오류가 발생했습니다."
    );
  }

  return response.json();
};
