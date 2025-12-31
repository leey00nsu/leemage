import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { confirmHandler } from "@/lib/api/confirm";

// POST 핸들러: 업로드 완료 확인 (API 키 기반 인증)
export const POST = withApiKeyAuth(async (req, context, userId) => {
  const params = (await context.params) as { projectId: string };
  return confirmHandler(req, params.projectId, userId);
});
