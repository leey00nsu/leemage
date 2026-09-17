import { parseTagFilter } from "@/shared/lib/project-tags";
import { tagSelect } from "@/lib/api/project-tags";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import { projectDetailsResponseSchema } from "@/lib/openapi/schemas/projects";
import {
  errorResponseSchema,
  messageResponseSchema,
} from "@/lib/openapi/schemas/common";
import { ImageVariantData } from "@/entities/files/model/types";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import { enqueueOwnedObjects } from "@/lib/storage/cleanup-queue";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";

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
    apiLogger.error("project.details.failed", getSafeErrorMetadata(error));
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

  try {
    const deleted = await prisma.$transaction(async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: projectId, userId },
        select: { id: true },
      });
      if (!project) return false;

      await enqueueOwnedObjects(tx, { projectId });
      const result = await tx.project.deleteMany({ where: { id: projectId, userId } });
      return result.count === 1;
    });
    if (!deleted) {
      return NextResponse.json(
        { message: "Resource not found." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        message: "Project deleted successfully. Storage cleanup was queued.",
      },
      { status: 200 },
    );
  } catch (error) {
    apiLogger.error("project.delete.failed", getSafeErrorMetadata(error));
    return NextResponse.json(
      { message: "An error occurred while deleting the project." },
      { status: 500 },
    );
  }
}
