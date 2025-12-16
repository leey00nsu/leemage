import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createProjectRequestSchema,
  projectResponseSchema,
  projectListResponseSchema,
} from "@/lib/openapi/schemas/projects";
import { errorResponseSchema } from "@/lib/openapi/schemas/common";
import { prisma } from "@/lib/prisma";
import { StorageProvider, StorageFactory } from "@/lib/storage";
import { toPrismaStorageProvider, fromPrismaStorageProvider } from "@/lib/storage/utils";

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
        storageProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Date를 ISO 문자열로 변환하고 storageProvider 변환
    const response: ProjectListResponse = projects.map((p) => ({
      ...p,
      storageProvider: fromPrismaStorageProvider(p.storageProvider),
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

    const { name, description, storageProvider } = validationResult.data;

    // 선택된 스토리지 프로바이더가 사용 가능한지 확인
    const provider = storageProvider || StorageProvider.OCI;
    const isAvailable = await StorageFactory.isProviderAvailable(provider);
    
    if (!isAvailable) {
      return NextResponse.json(
        { message: `선택한 스토리지 프로바이더(${provider})가 설정되지 않았습니다.` },
        { status: 400 }
      );
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        storageProvider: toPrismaStorageProvider(provider),
      },
    });

    // Date를 ISO 문자열로 변환하고 storageProvider 변환
    const response: ProjectResponse = {
      ...newProject,
      storageProvider: fromPrismaStorageProvider(newProject.storageProvider),
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
