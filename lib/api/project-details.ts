import { parseTagFilter } from "@/shared/lib/project-tags";
import { tagSelect } from "@/lib/api/project-tags";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import { projectDetailsResponseSchema } from "@/lib/openapi/schemas/projects";
import {
  errorResponseSchema,
  messageResponseSchema,
} from "@/lib/openapi/schemas/common";
import { ImageVariantData } from "@/entities/files/model/types";
import { verifyProjectOwnership } from "@/lib/auth/ownership";

// 응답 타입 추론
type ProjectDetailsResponse = z.infer<typeof projectDetailsResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;
type MessageResponse = z.infer<typeof messageResponseSchema>;

export async function getProjectDetailsHandler(
  projectId: string,
  userId: string,
  query = new URLSearchParams(),
): Promise<NextResponse<ProjectDetailsResponse | ErrorResponse>> {
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID is required." },
      { status: 400 },
    );
  }
  const requestedPage = Math.max(1, Math.min(10_000, Number(query.get("page")) || 1));
  const requestedPageSize = Number(query.get("pageSize"));
  const pageSize = [25, 50, 100].includes(requestedPageSize)
    ? requestedPageSize
    : 50;

  // 소유권 검증 (Requirement 3.1)
  const ownershipResult = await verifyProjectOwnership(userId, projectId);
  if (!ownershipResult.authorized) {
    return NextResponse.json(
      { message: "Resource not found." },
      { status: 404 },
    );
  }

  let tagFilter;
  try {
    tagFilter = parseTagFilter(query);
  } catch {
    return NextResponse.json(
      { message: "Invalid tag filter." },
      { status: 400 },
    );
  }
  try {
    const filesWhere = {
      projectId,
      ...tagFilter,
      status: "COMPLETED" as const,
    };
    const [project, total] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        omit: { userId: true },
      }),
      prisma.file.count({ where: filesWhere }),
    ]);

    if (!project) {
      return NextResponse.json(
        { message: "Project not found." },
        { status: 404 },
      );
    }

    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(requestedPage, pageCount);
    const projectFiles = await prisma.file.findMany({
      where: filesWhere,
      select: {
        tags: { select: tagSelect, orderBy: { name: "asc" } },
        id: true,
        name: true,
        mimeType: true,
        processingStatus: true,
        isImage: true,
        size: true,
        url: true,
        variants: true,
        createdAt: true,
        updatedAt: true,
        projectId: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const response: ProjectDetailsResponse = {
      ...project,
      storageProvider: fromPrismaStorageProvider(project.storageProvider),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      total,
      page,
      pageCount,
      pageSize,
      files: projectFiles.map((file) => ({
        ...file,
        thumbnail:
          (file.variants as unknown as ImageVariantData[]).find(
            (v) => v.label === "thumbnail",
          ) ?? null,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        variants: file.variants as unknown as ImageVariantData[],
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Fetch project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "An error occurred while fetching the project." },
      { status: 500 },
    );
  }
}

export async function deleteProjectHandler(
  projectId: string,
  userId: string,
): Promise<NextResponse<MessageResponse | ErrorResponse>> {
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID is required." },
      { status: 400 },
    );
  }

  // 소유권 검증 (Requirement 3.3)
  const ownershipResult = await verifyProjectOwnership(userId, projectId);
  if (!ownershipResult.authorized) {
    return NextResponse.json(
      { message: "Resource not found." },
      { status: 404 },
    );
  }

  try {
    await prisma.videoJob.deleteMany({ where: { file: { projectId } } });
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          select: { id: true, name: true, variants: true, objectName: true },
        },
      },
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { message: "Project to delete not found." },
        { status: 404 },
      );
    }

    // 프로젝트의 스토리지 프로바이더에 맞는 어댑터 가져오기
    const storageProvider = fromPrismaStorageProvider(
      projectToDelete.storageProvider,
    );
    const storageAdapter = await StorageFactory.getAdapter(storageProvider);

    // 스토리지 객체 삭제 로직
    const objectDeletionPromises: Promise<void>[] = [];
    projectToDelete.files.forEach((file) => {
      // 원본 파일 삭제
      if (file.objectName) {
        objectDeletionPromises.push(
          storageAdapter.deleteObject(file.objectName),
        );
      }

      // variant 파일들 삭제
      const variants = file.variants as unknown as ImageVariantData[];
      variants.forEach((variant) => {
        if (typeof variant?.url === "string") {
          try {
            // URL에서 객체 이름 추출 (프로바이더별로 다를 수 있음)
            const url = new URL(variant.url);
            const pathParts = url.pathname.split("/");
            // 마지막 두 부분이 projectId/filename 형태
            const objectName = pathParts.slice(-2).join("/");
            if (objectName) {
              objectDeletionPromises.push(
                storageAdapter.deleteObject(objectName),
              );
            }
          } catch (e) {
            console.error(
              `Error preparing deletion for variant URL ${variant.url}:`,
              e,
            );
          }
        }
      });
    });

    const deletionResults = await Promise.allSettled(objectDeletionPromises);
    deletionResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete storage object (index ${index}):`,
          result.reason,
        );
      }
    });

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json(
      {
        message:
          "Project and all related files (all versions) deleted successfully.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(`Delete project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "An error occurred while deleting the project." },
      { status: 500 },
    );
  }
}
