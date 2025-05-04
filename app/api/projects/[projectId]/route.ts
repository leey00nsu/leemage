import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET 핸들러: 특정 프로젝트 정보 및 포함된 이미지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // TODO: 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { projectId } = await params;

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        images: {
          // 프로젝트에 속한 이미지 정보 포함
          orderBy: {
            createdAt: "desc", // 최신 이미지 순으로 정렬
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error(`Fetch project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "프로젝트 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// TODO: 프로젝트 수정(PUT), 삭제(DELETE) 핸들러 추가 (필요시)
