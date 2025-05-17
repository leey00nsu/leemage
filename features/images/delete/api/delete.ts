interface DeleteImage {
  projectId: string;
  imageId: string;
}

export const deleteImage = async ({
  projectId,
  imageId,
}: DeleteImage): Promise<{ message: string }> => {
  const response = await fetch(`/api/projects/${projectId}/images/${imageId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "이미지 삭제에 실패했습니다.");
  }

  // DELETE 요청은 보통 본문이 없거나 간단한 메시지만 반환
  // 성공 시 메시지만 반환하도록 처리 (필요시 API 응답 구조에 맞게 조정)
  try {
    return await response.json();
  } catch (error) {
    // 응답 본문이 비어있는 경우 등 json 파싱 에러 처리
    console.error("이미지 삭제 응답 파싱 오류:", error);
    return { message: "이미지가 성공적으로 삭제되었습니다." };
  }
};
