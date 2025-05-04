import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/features/projects/create/model/schema";
import { prisma } from "@/lib/prisma"; // Prisma Client 인스턴스 임포트

// GET 핸들러 추가: 모든 프로젝트 조회
export async function GET() {
  // TODO: 사용자 인증/권한 확인 로직 추가
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc", // 최신순으로 정렬
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Fetch projects API error:", error);
    return NextResponse.json(
      { message: "프로젝트 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // TODO: 사용자 인증 확인 로직 추가 (현재는 생략)

  try {
    const body = await req.json();

    // 1. 요청 본문 유효성 검사
    const validationResult = createProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: "잘못된 요청 형식입니다.",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { name, description } = validationResult.data;

    // 2. 데이터베이스에 프로젝트 생성
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        // TODO: 생성한 사용자 ID 연결 (인증 구현 후)
      },
    });

    // 3. 성공 응답 반환 (201 Created)
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Project creation API error:", error);
    // TODO: 데이터베이스 관련 에러(예: 중복 이름) 등 더 구체적인 에러 처리
    return NextResponse.json(
      { message: "프로젝트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
