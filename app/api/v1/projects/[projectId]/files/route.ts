import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { uploadFileHandler } from "@/lib/api/files";

// POST 핸들러: 파일 업로드 (API 키 기반 인증)
export const POST = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as { projectId: string };
  return uploadFileHandler(req, params.projectId);
});
