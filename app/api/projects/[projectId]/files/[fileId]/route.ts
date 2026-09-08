import { getFileHandler } from "@/lib/api/file-get";
import { deleteFileHandler } from "@/lib/api/file-delete";
import { withSessionAuth, AuthenticatedRequest } from "@/lib/auth/session-auth";

// DELETE 핸들러: 파일 삭제 (세션 기반 인증)
export const DELETE = withSessionAuth(
  async (
    req: AuthenticatedRequest,
    context: { params: Promise<{ projectId: string; fileId: string }> },
  ) => {
    const { fileId, projectId } = await context.params;
    const userId = req.session.username!;
    return deleteFileHandler(fileId, projectId, userId);
  },
);

export const GET = withSessionAuth(
  async (
    request,
    context: { params: Promise<{ projectId: string; fileId: string }> },
  ) => {
    const { projectId, fileId } = await context.params;
    return getFileHandler(fileId, projectId, request.session.username!);
  },
);
