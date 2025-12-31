import { confirmHandler } from "@/lib/api/confirm";
import { withRateLimitAndAuth, uploadRateLimiter } from "@/lib/auth/rate-limiter";
import { AuthenticatedRequest } from "@/lib/auth/session-auth";

// POST 핸들러: 업로드 완료 확인 (세션 인증 + Rate Limiting)
export const POST = withRateLimitAndAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const projectId = (await params).projectId;
  const userId = request.session.username!;
  return confirmHandler(request, projectId, userId);
}, uploadRateLimiter);
