import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci"; // OCI 객체 삭제 함수 (oci.ts에 구현 필요)

export async function DELETE(
  req: Request, // req는 현재 사용하지 않지만, 인증/인가 로직 추가 시 필요
  context: { params: { projectId: string; imageId: string } }
) {
  try {
    const { projectId, imageId } = context.params;

    // 1. 데이터베이스에서 이미지 정보 조회 (OCI 객체 이름을 알아야 함)
    const image = await prisma.image.findUnique({
      where: { id: imageId },
      select: { name: true, url: true }, // OCI 삭제에 필요한 정보만 선택
    });

    if (!image) {
      return NextResponse.json(
        { message: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // OCI 객체 이름 구성 (업로드 시 사용한 형식과 동일하게)
    // 가정: 업로드 시 `${projectId}/${cuid()}.${fileExtension}` 형식을 사용했고,
    // URL 구조가 `.../o/projectId/imageId.ext` 형태라고 가정하고 추출
    const urlParts = image.url.split("/o/");
    if (urlParts.length < 2) {
      // URL 형식이 예상과 다를 경우 에러 처리 또는 다른 방식 시도
      console.error(`Invalid OCI URL format: ${image.url}`);
      throw new Error("데이터베이스에 저장된 OCI URL 형식이 잘못되었습니다.");
    }
    const objectPath = urlParts[1]; // 예: projectId/imageId.ext
    // objectPath가 projectId로 시작하는지 추가 검증 가능 (선택적)
    if (!objectPath.startsWith(`${projectId}/`)) {
      console.warn(
        `Warning: OCI object path '${objectPath}' does not seem to start with the expected projectId '${projectId}'. Deleting anyway.`
      );
      // 필요시 여기서 에러 처리 가능
    }

    // 2. OCI Object Storage에서 이미지 파일 삭제
    await deleteObject(objectPath); // 수정: objectPath 전달

    // 3. 데이터베이스에서 이미지 레코드 삭제
    await prisma.image.delete({
      where: { id: imageId },
    });

    console.log(
      `Image deleted: DB ID = ${imageId}, OCI Object = ${objectPath}` // 수정: objectPath 로깅
    );
    return NextResponse.json(
      { message: "이미지가 성공적으로 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting image:", error);
    // OCI 삭제 오류 등 특정 오류 처리 추가 가능
    return NextResponse.json(
      { message: "이미지 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
