import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { deleteFileHandler } from "@/lib/api/file-delete";

// DELETE 핸들러: 파일 삭제 (API 키 기반 인증)
export const DELETE = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as {
    projectId: string;
    fileId: string;
  };
  return deleteFileHandler(params.fileId, params.projectId);
});
