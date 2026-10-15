export const deleteFiles = async ({
  projectId,
  fileIds,
}: {
  projectId: string;
  fileIds: string[];
}): Promise<{ message: string }> => {
  const response = await fetch(`/api/projects/${projectId}/files/bulk-delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileIds }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || "파일 삭제에 실패했습니다.");
  }
  return response.json();
};
