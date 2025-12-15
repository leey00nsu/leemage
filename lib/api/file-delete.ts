import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";
import { ImageVariantData } from "@/entities/files";

export async function deleteFileHandler(fileId: string, projectId?: string) {
  try {
    if (!fileId) {
      return NextResponse.json(
        { message: "File ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 데이터베이스에서 파일 정보 조회 (variants 포함)
    const whereCondition = projectId
      ? { id: fileId, projectId: projectId }
      : { id: fileId };

    const file = await prisma.image.findUnique({
      where: whereCondition,
      select: { id: true, name: true, url: true, variants: true, projectId: true },
    });

    if (!file) {
      return NextResponse.json(
        { message: "파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const objectDeletionPromises: Promise<void>[] = [];
    const deletedObjectNames: string[] = [];

    // 비이미지 파일의 경우 url에서 직접 삭제
    if (file.url) {
      try {
        const urlParts = file.url.split("/o/");
        if (urlParts.length >= 2) {
          const objectName = urlParts[1];
          deletedObjectNames.push(objectName);
          objectDeletionPromises.push(deleteObject(objectName));
        }
      } catch (e) {
        console.error(`Error preparing deletion for file URL ${file.url}:`, e);
      }
    }

    // 이미지 파일의 경우 모든 variants에서 OCI 객체 삭제
    const variants = file.variants as ImageVariantData[];
    variants?.forEach((variant) => {
      if (typeof variant?.url === "string") {
        try {
          const urlParts = variant.url.split("/o/");
          if (urlParts.length < 2) {
            console.warn(`Invalid OCI URL format in variant: ${variant.url}`);
            return;
          }
          const objectName = urlParts[1];

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
      console.warn(`No valid OCI objects found to delete for file ${fileId}.`);
    }

    // 데이터베이스에서 파일 레코드 삭제
    await prisma.image.delete({
      where: { id: fileId },
    });

    console.log(
      `File deleted: DB ID = ${fileId}, OCI Objects = [${deletedObjectNames.join(
        ", "
      )}]`
    );

    return NextResponse.json(
      { message: "파일이 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { message: "파일 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 이전 함수명과의 호환성을 위한 별칭
export const deleteImageHandler = deleteFileHandler;
