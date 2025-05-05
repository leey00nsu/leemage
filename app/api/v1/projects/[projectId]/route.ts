import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";
import { type ImageVariantData } from "../../../projects/[projectId]/images/route";
import { withApiKeyAuth, type ApiHandlerEvent } from "@/lib/auth/api-key-auth";

// --- GET 핸들러 시그니처 수정 ---
async function handleGetProject(
  request: NextRequest,
  context: ApiHandlerEvent
) {
  const projectId = context?.params?.projectId as string;
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID required" },
      { status: 400 }
    );
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        images: {
          select: {
            id: true,
            name: true,
            variants: true,
            createdAt: true,
            updatedAt: true,
            projectId: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    const processedProject = {
      ...project,
      images: project.images.map((img) => ({
        ...img,
        variants: img.variants as ImageVariantData[],
      })),
    };

    return NextResponse.json(processedProject);
  } catch (error) {
    console.error(
      `[API v1 GET Project ${projectId}] Fetch project API error:`,
      error
    );
    return NextResponse.json(
      { message: "Error fetching project" },
      { status: 500 }
    );
  }
}

// --- DELETE 핸들러 시그니처 수정 ---
async function handleDeleteProject(
  request: NextRequest,
  context: ApiHandlerEvent
) {
  const projectId = context?.params?.projectId as string;
  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID required" },
      { status: 400 }
    );
  }

  try {
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
      include: { images: { select: { variants: true } } }, // variants만 필요
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { message: "Project not found" },
        { status: 404 }
      );
    }

    // OCI 객체 삭제 로직
    const objectDeletionPromises: Promise<void>[] = [];
    projectToDelete.images.forEach((image) => {
      const variants = image.variants as ImageVariantData[];
      variants?.forEach((variant) => {
        // variants가 null일 수 있음에 주의
        if (typeof variant?.url === "string") {
          try {
            const urlParts = variant.url.split("/o/");
            if (urlParts.length < 2) return;
            const objectName = urlParts[1];
            objectDeletionPromises.push(deleteObject(objectName));
          } catch (e) {
            console.error(
              `[API v1 DELETE Project ${projectId}] Error parsing variant URL ${variant.url}:`,
              e
            );
          }
        }
      });
    });

    const deletionResults = await Promise.allSettled(objectDeletionPromises);
    deletionResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error(
          `[API v1 DELETE Project ${projectId}] Failed to delete OCI object:`,
          result.reason
        );
      }
    });

    // DB에서 프로젝트 삭제
    await prisma.project.delete({ where: { id: projectId } });

    return NextResponse.json(
      { message: "Project and related images deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      `[API v1 DELETE Project ${projectId}] Delete project API error:`,
      error
    );
    return NextResponse.json(
      { message: "Error deleting project" },
      { status: 500 }
    );
  }
}

// --- 핸들러 export (withApiKeyAuth 적용) ---
export const GET = withApiKeyAuth(handleGetProject);
export const DELETE = withApiKeyAuth(handleDeleteProject);
