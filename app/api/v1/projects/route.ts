import { NextRequest } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { getProjectsHandler, createProjectHandler } from "@/lib/api/projects";

// GET 핸들러: 프로젝트 목록 조회 (API 키 기반 인증)
export const GET = withApiKeyAuth(async (_req, _context, userId) => {
  return getProjectsHandler(userId);
});

// POST 핸들러: 프로젝트 생성 (API 키 기반 인증)
export const POST = withApiKeyAuth(async (req, _context, userId) => {
  return createProjectHandler(req, userId);
});
