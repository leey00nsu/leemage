import { deleteFileHandler } from "@/lib/api/file-delete";

// DELETE 핸들러: 파일 삭제 (세션 기반 인증)
export async function DELETE(
  req: Request,
  context: { params: Promise<{ projectId: string; fileId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { fileId, projectId } = await context.params;
  return deleteFileHandler(fileId, projectId);
}
