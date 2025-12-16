import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createProjectRequestSchema,
  projectResponseSchema,
  projectListResponseSchema,
} from "@/lib/openapi/schemas/projects";
import { errorResponseSchema } from "@/lib/openapi/schemas/common";
import { prisma } from "@/lib/prisma";

// 응답 타입 추론
type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
type ProjectResponse = z.infer<typeof projectResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;

export async function getProjectsHandler(): Promise<
  NextResponse<ProjectListResponse | ErrorResponse>
> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Date를 ISO 문자열로 변환
    const response: ProjectListResponse = projects.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("Fetch projects API error:", error);
    return NextResponse.json(
      { message: "프로젝트 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function createProjectHandler(
  req: NextRequest
): Promise<NextResponse<ProjectResponse | ErrorResponse>> {
  try {
    const body = await req.json();
    const validationResult = createProjectRequestSchema.safeParse(body);

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

    // Date를 ISO 문자열로 변환
    const response: ProjectResponse = {
      ...newProject,
      createdAt: newProject.createdAt.toISOString(),
      updatedAt: newProject.updatedAt.toISOString(),
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Project creation API error:", error);
    return NextResponse.json(
      { message: "프로젝트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
