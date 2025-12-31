import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import { ImageVariantData } from "@/entities/files/model/types";
import { verifyFileOwnershipWithProject } from "@/lib/auth/ownership";

export async function deleteFileHandler(
  fileId: string,
  projectId: string,
  userId: string
) {
  try {
    if (!fileId) {
      return NextResponse.json(
        { message: "File ID가 필요합니다." },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { message: "Project ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 소유권 검증 (Requirement 3.2)
    const ownershipResult = await verifyFileOwnershipWithProject(userId, fileId, projectId);
    if (!ownershipResult.authorized) {
      return NextResponse.json(
        { message: "리소스를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 데이터베이스에서 파일 정보 조회 (variants 포함, 프로젝트 정보도 함께)
    const file = await prisma.file.findUnique({
      where: { id: fileId, projectId },
      select: {
        id: true,
        name: true,
        url: true,
        objectName: true,
        variants: true,
        projectId: true,
        project: {
          select: { storageProvider: true },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 프로젝트의 스토리지 프로바이더에 맞는 어댑터 가져오기
    const storageProvider = fromPrismaStorageProvider(file.project.storageProvider);
    const storageAdapter = await StorageFactory.getAdapter(storageProvider);

    const objectDeletionPromises: Promise<void>[] = [];
    const deletedObjectNames: string[] = [];

    // 원본 파일 삭제 (objectName이 있는 경우)
    if (file.objectName) {
      deletedObjectNames.push(file.objectName);
      objectDeletionPromises.push(storageAdapter.deleteObject(file.objectName));
    }

    // 이미지 파일의 경우 모든 variants에서 스토리지 객체 삭제
    const variants = file.variants as ImageVariantData[];
    variants?.forEach((variant) => {
      if (typeof variant?.url === "string") {
        try {
          // URL에서 객체 이름 추출
          const url = new URL(variant.url);
          const pathParts = url.pathname.split("/");
          // 마지막 두 부분이 projectId/filename 형태
          const objectName = pathParts.slice(-2).join("/");

          if (objectName && !deletedObjectNames.includes(objectName)) {
            if (projectId && !objectName.startsWith(`${projectId}/`)) {
              console.warn(
                `Object name ${objectName} does not match project ID ${projectId}`
              );
              return;
            }

            deletedObjectNames.push(objectName);
            objectDeletionPromises.push(storageAdapter.deleteObject(objectName));
          }
        } catch (e) {
          console.error(
            `Error preparing deletion for variant URL ${variant.url}:`,
            e
          );
        }
      }
    });

    // 모든 스토리지 객체 삭제 시도
    if (objectDeletionPromises.length > 0) {
      const deletionResults = await Promise.allSettled(objectDeletionPromises);
      deletionResults.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Failed to delete storage object ${deletedObjectNames[index]}:`,
            result.reason
          );
        }
      });
    } else {
      console.warn(`No valid storage objects found to delete for file ${fileId}.`);
    }

    // 데이터베이스에서 파일 레코드 삭제
    await prisma.file.delete({
      where: { id: fileId },
    });

    console.log(
      `File deleted: DB ID = ${fileId}, Storage Objects = [${deletedObjectNames.join(
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
