import { NextRequest } from "next/server";
import { getProjectsHandler, createProjectHandler } from "@/lib/api/projects";

// GET 핸들러: 모든 프로젝트 조회 (세션 기반 인증)
export async function GET() {
  // TODO: 세션 기반 사용자 인증/권한 확인 로직 추가
  return getProjectsHandler();
}

// POST 핸들러: 프로젝트 생성 (세션 기반 인증)
export async function POST(req: NextRequest) {
  // TODO: 세션 기반 사용자 인증 확인 로직 추가
  return createProjectHandler(req);
}
