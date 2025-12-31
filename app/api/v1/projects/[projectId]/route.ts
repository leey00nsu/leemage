import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import {
  getProjectDetailsHandler,
  deleteProjectHandler,
} from "@/lib/api/project-details";

// GET 핸들러: 프로젝트 상세 조회 (API 키 기반 인증)
export const GET = withApiKeyAuth(async (_req, context, userId) => {
  const params = (await context.params) as { projectId: string };
  return getProjectDetailsHandler(params.projectId, userId);
});

// DELETE 핸들러: 프로젝트 삭제 (API 키 기반 인증)
export const DELETE = withApiKeyAuth(async (_req, context, userId) => {
  const params = (await context.params) as { projectId: string };
  return deleteProjectHandler(params.projectId, userId);
});
