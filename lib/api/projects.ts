import { NextRequest, NextResponse } from "next/server";
import { createProjectSchema } from "@/features/projects/create/model/schema";
import { prisma } from "@/lib/prisma";

export async function getProjectsHandler() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: { id: true, name: true, description: true, createdAt: true },
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

export async function createProjectHandler(req: NextRequest) {
  try {
    const body = await req.json();
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

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Project creation API error:", error);
    return NextResponse.json(
      { message: "프로젝트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
