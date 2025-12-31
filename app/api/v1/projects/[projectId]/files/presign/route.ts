import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { presignHandler } from "@/lib/api/presign";

// POST 핸들러: Presigned URL 생성 (API 키 기반 인증)
export const POST = withApiKeyAuth(async (req, context, userId) => {
  const params = (await context.params) as { projectId: string };
  return presignHandler(req, params.projectId, userId);
});
