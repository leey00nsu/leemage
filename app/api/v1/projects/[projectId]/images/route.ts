import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { uploadImageHandler } from "@/lib/api/images";

// POST 핸들러: 이미지 업로드 (API 키 기반 인증)
export const POST = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as { projectId: string };
  return uploadImageHandler(req, params.projectId);
});
