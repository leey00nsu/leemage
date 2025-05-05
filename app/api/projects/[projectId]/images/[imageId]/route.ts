import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci";

// ImageVariantData 타입 정의 (공유 타입으로 분리 권장)
type ImageVariantData = {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  label?: string;
};

export async function DELETE(
  req: Request,
  context: { params: { projectId: string; imageId: string } }
) {
  try {
    const { imageId } = context.params;

    // 1. 데이터베이스에서 이미지 정보 조회 (variants 포함)
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { id: true, name: true, variants: true, projectId: true }, // projectId도 가져오기
    });

    if (!image) {
      return NextResponse.json(
        { message: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 모든 variants에서 OCI 객체 이름 추출 및 삭제 준비
    const variants = image.variants as ImageVariantData[]; // 타입 단언 (실제 타입 검증 추가 권장)
    const objectDeletionPromises: Promise<void>[] = [];
    const deletedObjectNames: string[] = []; // 로깅용

    variants.forEach((variant) => {
      if (typeof variant?.url === "string") {
        try {
          const urlParts = variant.url.split("/o/");
          if (urlParts.length < 2) {
            console.warn(`Invalid OCI URL format in variant: ${variant.url}`);
            return; // 다음 variant로 넘어감
          }
          const objectName = urlParts[1];
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

    // 3. 모든 OCI 객체 삭제 시도
    if (objectDeletionPromises.length > 0) {
      const deletionResults = await Promise.allSettled(objectDeletionPromises);
      // OCI 삭제 결과 로깅
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

    // 4. 데이터베이스에서 이미지 레코드 삭제
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
