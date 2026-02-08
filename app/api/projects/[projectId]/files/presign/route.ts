import { presignHandler } from "@/lib/api/presign";
import { AuthenticatedRequest, withSessionAuth } from "@/lib/auth/session-auth";

// POST 핸들러: Presigned URL 생성 (세션 인증)
export const POST = withSessionAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const projectId = (await params).projectId;
  const userId = request.session.username!;

  return presignHandler(request, projectId, userId);
});
