import { deleteImageHandler } from "@/lib/api/image-delete";

// DELETE 핸들러: 이미지 삭제 (세션 기반 인증)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ projectId: string; imageId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { imageId, projectId } = await context.params;
  return deleteImageHandler(imageId, projectId);
}
