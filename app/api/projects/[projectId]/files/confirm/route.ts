import { confirmHandler } from "@/lib/api/confirm";
import { AuthenticatedRequest, withSessionAuth } from "@/lib/auth/session-auth";

// POST 핸들러: 업로드 완료 확인 (세션 인증)
export const POST = withSessionAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const projectId = (await params).projectId;
  const userId = request.session.username!;
  return confirmHandler(request, projectId, userId);
});
