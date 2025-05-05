import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";
import { withApiKeyAuth } from "@/lib/auth/api-key-auth";

// ImageVariantData 타입 정의 (공유 타입으로 분리 권장)
type ImageVariantData = {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  label?: string;
};

// --- 기존 DELETE 핸들러 로직 (시그니처 수정) ---
async function handleDeleteImage(
  req: NextRequest, // NextRequest 사용
  context: { params: { projectId: string; imageId: string } } // 타입 명시
) {
  try {
    const { projectId, imageId } = context.params;
    if (!imageId) {
      return NextResponse.json(
        { message: "Image ID required" },
        { status: 400 }
      );
    }

    // DB에서 이미지 정보 조회
    const image = await prisma.image.findUnique({
      where: { id: imageId, projectId: projectId }, // projectId도 조건에 추가 (보안 강화)
      select: { variants: true },
    });

    if (!image) {
      return NextResponse.json({ message: "Image not found" }, { status: 404 });
    }

    // OCI 객체 삭제 로직
    const variants = image.variants as ImageVariantData[];
    const objectDeletionPromises: Promise<void>[] = [];
    const deletedObjectNames: string[] = [];

    variants?.forEach((variant) => {
      // null 체크 추가
      if (typeof variant?.url === "string") {
        try {
          const urlParts = variant.url.split("/o/");
          if (urlParts.length < 2) return;
          const objectName = urlParts[1];
          // projectId 검증 (선택적이지만 권장 - objectName이 예상 경로와 일치하는지)
          if (!objectName.startsWith(`${projectId}/`)) {
            console.warn(
              `[API v1 DELETE Image] Object name ${objectName} does not match project ID ${projectId}`
            );
            return;
          }
          deletedObjectNames.push(objectName);
          objectDeletionPromises.push(deleteObject(objectName));
        } catch (e) {
          console.error(
            `[API v1 DELETE Image] Error parsing variant URL ${variant.url}:`,
            e
          );
        }
      }
    });

    if (objectDeletionPromises.length > 0) {
      const deletionResults = await Promise.allSettled(objectDeletionPromises);
      deletionResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `[API v1 DELETE Image] Failed to delete OCI object ${deletedObjectNames[index]}:`,
            result.reason
          );
        }
      });
    } else {
      console.warn(
        `[API v1 DELETE Image] No valid OCI objects found for image ${imageId}.`
      );
    }

    // DB에서 이미지 레코드 삭제
    await prisma.image.delete({ where: { id: imageId } });

    console.log(`[API v1 DELETE Image] Image deleted: DB ID = ${imageId}`);
    return NextResponse.json(
      { message: "Image deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API v1 DELETE Image] Error deleting image:", error);
    return NextResponse.json(
      { message: "Error deleting image" },
      { status: 500 }
    );
  }
}

// --- 핸들러 export (withApiKeyAuth 적용) ---
export const DELETE = withApiKeyAuth(handleDeleteImage);
