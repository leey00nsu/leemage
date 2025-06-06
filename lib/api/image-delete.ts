import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";
import { ImageVariantData } from "@/entities/images/model/types";

export async function deleteImageHandler(imageId: string, projectId?: string) {
  try {
    if (!imageId) {
      return NextResponse.json(
        { message: "Image ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 데이터베이스에서 이미지 정보 조회 (variants 포함)
    const whereCondition = projectId
      ? { id: imageId, projectId: projectId }
      : { id: imageId };

    const image = await prisma.image.findUnique({
      where: whereCondition,
      select: { id: true, name: true, variants: true, projectId: true },
    });

    if (!image) {
      return NextResponse.json(
        { message: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 모든 variants에서 OCI 객체 이름 추출 및 삭제 준비
    const variants = image.variants as ImageVariantData[];
    const objectDeletionPromises: Promise<void>[] = [];
    const deletedObjectNames: string[] = [];

    variants?.forEach((variant) => {
      if (typeof variant?.url === "string") {
        try {
          const urlParts = variant.url.split("/o/");
          if (urlParts.length < 2) {
            console.warn(`Invalid OCI URL format in variant: ${variant.url}`);
            return;
          }
          const objectName = urlParts[1];

          // projectId가 제공된 경우 추가 검증
          if (projectId && !objectName.startsWith(`${projectId}/`)) {
            console.warn(
              `Object name ${objectName} does not match project ID ${projectId}`
            );
            return;
          }

          deletedObjectNames.push(objectName);
          objectDeletionPromises.push(deleteObject(objectName));
        } catch (e) {
          console.error(
            `Error preparing deletion for variant URL ${variant.url}:`,
            e
          );
        }
      } else {
        console.warn(`Variant object is missing or has invalid URL:`, variant);
      }
    });

    // 모든 OCI 객체 삭제 시도
    if (objectDeletionPromises.length > 0) {
      const deletionResults = await Promise.allSettled(objectDeletionPromises);
      deletionResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete OCI object ${deletedObjectNames[index]}:`,
            result.reason
          );
        }
      });
    } else {
      console.warn(
        `No valid OCI objects found to delete for image ${imageId}.`
      );
    }

    // 데이터베이스에서 이미지 레코드 삭제
    await prisma.image.delete({
      where: { id: imageId },
    });

    console.log(
      `Image deleted: DB ID = ${imageId}, OCI Objects = [${deletedObjectNames.join(
        ", "
      )}]`
    );

    return NextResponse.json(
      { message: "이미지 및 관련 버전 파일이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { message: "이미지 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
