import {
  getProjectDetailsHandler,
  deleteProjectHandler,
} from "@/lib/api/project-details";
import { updateProjectHandler } from "@/lib/api/projects";
import { withSessionAuth, AuthenticatedRequest } from "@/lib/auth/session-auth";

// GET 핸들러: 특정 프로젝트 정보 및 포함된 이미지 목록(variants 포함) 조회 (세션 기반 인증)
export const GET = withSessionAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params;
  const userId = request.session.username!;
  return getProjectDetailsHandler(projectId, userId);
});

// DELETE 핸들러: 특정 프로젝트 및 관련 OCI 이미지(모든 variants) 삭제 (세션 기반 인증)
export const DELETE = withSessionAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params;
  const userId = request.session.username!;
  return deleteProjectHandler(projectId, userId);
});

// PATCH 핸들러: 프로젝트 이름/설명 수정 (세션 기반 인증)
export const PATCH = withSessionAuth(async (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params;
  const userId = request.session.username!;
  return updateProjectHandler(request, projectId, userId);
});
