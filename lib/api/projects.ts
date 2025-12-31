import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createProjectRequestSchema,
  updateProjectRequestSchema,
  projectResponseSchema,
  projectListResponseSchema,
} from "@/lib/openapi/schemas/projects";
import { errorResponseSchema } from "@/lib/openapi/schemas/common";
import { prisma } from "@/lib/prisma";
import { StorageProvider, StorageFactory } from "@/lib/storage";
import { toPrismaStorageProvider, fromPrismaStorageProvider } from "@/lib/storage/utils";
import { verifyProjectOwnership, OWNERSHIP_ERROR_CODES } from "@/lib/auth/ownership";

// 응답 타입 추론
type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
type ProjectResponse = z.infer<typeof projectResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;

export async function getProjectsHandler(
  userId: string
): Promise<NextResponse<ProjectListResponse | ErrorResponse>> {
  try {
    const projects = await prisma.project.findMany({
      where: {
        userId, // 사용자 소유 프로젝트만 조회
      },
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
  req: NextRequest,
  userId: string
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
    const provider = (storageProvider || StorageProvider.OCI) as StorageProvider;
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
        userId, // 프로젝트 소유자 저장
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


export async function updateProjectHandler(
  req: NextRequest,
  projectId: string,
  userId: string
): Promise<NextResponse<ProjectResponse | ErrorResponse>> {
  try {
    // 소유권 검증 (Requirement 3.3)
    const ownershipResult = await verifyProjectOwnership(userId, projectId);
    if (!ownershipResult.authorized) {
      return NextResponse.json(
        { message: "리소스를 찾을 수 없습니다." },
        { status: ownershipResult.reason === OWNERSHIP_ERROR_CODES.NOT_FOUND ? 404 : 403 }
      );
    }

    const body = await req.json();
    const validationResult = updateProjectRequestSchema.safeParse(body);

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

    // 이름이 제공되었지만 공백만 있는 경우 거부
    if (name !== undefined && name.trim().length === 0) {
      return NextResponse.json(
        { message: "프로젝트 이름은 필수입니다." },
        { status: 400 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData: { name?: string; description?: string } = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description;
    }

    // 업데이트할 내용이 없으면 기존 프로젝트 반환
    if (Object.keys(updateData).length === 0) {
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
      });
      
      if (!existingProject) {
        return NextResponse.json(
          { message: "프로젝트를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      const response: ProjectResponse = {
        ...existingProject,
        storageProvider: fromPrismaStorageProvider(existingProject.storageProvider),
        createdAt: existingProject.createdAt.toISOString(),
        updatedAt: existingProject.updatedAt.toISOString(),
      };
      return NextResponse.json(response);
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    const response: ProjectResponse = {
      ...updatedProject,
      storageProvider: fromPrismaStorageProvider(updatedProject.storageProvider),
      createdAt: updatedProject.createdAt.toISOString(),
      updatedAt: updatedProject.updatedAt.toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Project update API error:", error);
    return NextResponse.json(
      { message: "프로젝트 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
