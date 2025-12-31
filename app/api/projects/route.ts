import { getProjectsHandler, createProjectHandler } from "@/lib/api/projects";
import { withSessionAuth, AuthenticatedRequest } from "@/lib/auth/session-auth";

// GET 핸들러: 모든 프로젝트 조회 (세션 기반 인증)
export const GET = withSessionAuth(async (req: AuthenticatedRequest) => {
  const userId = req.session.username!;
  return getProjectsHandler(userId);
});

// POST 핸들러: 프로젝트 생성 (세션 기반 인증)
export const POST = withSessionAuth(async (req: AuthenticatedRequest) => {
  const userId = req.session.username!;
  return createProjectHandler(req, userId);
});
