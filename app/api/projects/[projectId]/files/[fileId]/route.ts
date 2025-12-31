import { deleteFileHandler } from "@/lib/api/file-delete";
import { withSessionAuth, AuthenticatedRequest } from "@/lib/auth/session-auth";

// DELETE 핸들러: 파일 삭제 (세션 기반 인증)
export const DELETE = withSessionAuth(async (
  req: AuthenticatedRequest,
  context: { params: Promise<{ projectId: string; fileId: string }> }
) => {
  const { fileId, projectId } = await context.params;
  const userId = req.session.username!;
  return deleteFileHandler(fileId, projectId, userId);
});
