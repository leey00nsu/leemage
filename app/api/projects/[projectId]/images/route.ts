import { NextRequest } from "next/server";
import { uploadImageHandler } from "@/lib/api/images";

// POST 핸들러: 이미지 업로드 (세션 기반 인증)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // TODO: 세션 기반 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const projectId = (await params).projectId;
  return uploadImageHandler(request, projectId);
}
