import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";
import { projectDetailsResponseSchema } from "@/lib/openapi/schemas/projects";
import {
  errorResponseSchema,
  messageResponseSchema,
} from "@/lib/openapi/schemas/common";
import { ImageVariantData } from "@/entities/files/model/types";

// 응답 타입 추론
type ProjectDetailsResponse = z.infer<typeof projectDetailsResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;
type MessageResponse = z.infer<typeof messageResponseSchema>;

export async function getProjectDetailsHandler(
  projectId: string
): Promise<NextResponse<ProjectDetailsResponse | ErrorResponse>> {
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
          where: {
            status: "COMPLETED", // COMPLETED 상태의 파일만 조회
          },
          select: {
            id: true,
            name: true,
            mimeType: true,
            isImage: true,
            size: true,
            url: true,
            variants: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
          },
          orderBy: {
            createdAt: "desc",
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

    // API 응답에서 images를 files로 변환하고 Date를 ISO 문자열로 변환
    const { images, ...projectData } = project;
    const response: ProjectDetailsResponse = {
      ...projectData,
      createdAt: projectData.createdAt.toISOString(),
      updatedAt: projectData.updatedAt.toISOString(),
      files: images.map((file) => ({
        ...file,
        createdAt: file.createdAt.toISOString(),
        updatedAt: file.updatedAt.toISOString(),
        variants: file.variants as unknown as ImageVariantData[],
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Fetch project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "프로젝트 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function deleteProjectHandler(
  projectId: string
): Promise<NextResponse<MessageResponse | ErrorResponse>> {
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        images: {
          select: { id: true, name: true, variants: true },
        },
      },
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { message: "삭제할 프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // OCI 객체 삭제 로직
    const objectDeletionPromises: Promise<void>[] = [];
    projectToDelete.images.forEach((image) => {
      const variants = image.variants as unknown as ImageVariantData[];
      variants.forEach((variant) => {
        if (typeof variant?.url === "string") {
          try {
            const urlParts = variant.url.split("/o/");
            if (urlParts.length < 2) {
              console.warn(`Invalid OCI URL format in variant: ${variant.url}`);
              return;
            }
            const objectName = urlParts[1];
            objectDeletionPromises.push(deleteObject(objectName));
          } catch (e) {
            console.error(
              `Error preparing deletion for variant URL ${variant.url}:`,
              e
            );
          }
        } else {
          console.warn(
            `Variant object is missing or has invalid URL:`,
            variant
          );
        }
      });
    });

    const deletionResults = await Promise.allSettled(objectDeletionPromises);
    deletionResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete OCI object (index ${index}):`,
          result.reason
        );
      }
    });

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    return NextResponse.json(
      { message: "프로젝트 및 관련 이미지(모든 버전)가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Delete project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "프로젝트 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
