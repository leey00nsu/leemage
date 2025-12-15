interface DeleteFile {
  projectId: string;
  fileId: string;
}

export const deleteFile = async ({
  projectId,
  fileId,
}: DeleteFile): Promise<{ message: string }> => {
  const response = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "파일 삭제에 실패했습니다.");
  }

  try {
    return await response.json();
  } catch (error) {
    console.error("파일 삭제 응답 파싱 오류:", error);
    return { message: "파일이 성공적으로 삭제되었습니다." };
  }
};

// 이전 함수명과의 호환성을 위한 별칭
export const deleteImage = deleteFile;
