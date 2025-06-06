import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { deleteImageHandler } from "@/lib/api/image-delete";

// DELETE 핸들러: 이미지 삭제 (API 키 기반 인증)
export const DELETE = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as {
    projectId: string;
    imageId: string;
  };
  return deleteImageHandler(params.imageId, params.projectId);
});
