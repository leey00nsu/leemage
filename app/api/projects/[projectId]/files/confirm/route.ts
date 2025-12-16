import { NextRequest } from "next/server";
import { confirmHandler } from "@/lib/api/confirm";

// POST 핸들러: 업로드 완료 확인 (세션 기반 인증)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const projectId = (await params).projectId;
  return confirmHandler(request, projectId);
}
