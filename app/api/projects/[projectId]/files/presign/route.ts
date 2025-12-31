import { NextRequest, NextResponse } from "next/server";
import { presignHandler } from "@/lib/api/presign";
import { getSessionDefault } from "@/lib/session";

// POST 핸들러: Presigned URL 생성 (세션 인증)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  // 세션 검증
  const session = await getSessionDefault();
  
  if (!session.isLoggedIn) {
    return NextResponse.json(
      { code: "AUTH_NO_SESSION", message: "인증이 필요합니다" },
      { status: 401 }
    );
  }

  const projectId = (await params).projectId;
  const userId = session.username!;
  
  return presignHandler(request, projectId, userId);
}
