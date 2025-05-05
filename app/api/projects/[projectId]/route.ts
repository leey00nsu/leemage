import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci"; // OCI 삭제 함수 임포트

// GET 핸들러: 특정 프로젝트 정보 및 포함된 이미지 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // TODO: 사용자 인증 및 프로젝트 접근 권한 확인 로직 추가
  const { projectId } = await params;

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
          // 프로젝트에 속한 이미지 정보 포함
          orderBy: {
            createdAt: "desc", // 최신 이미지 순으로 정렬
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

    return NextResponse.json(project);
  } catch (error) {
    console.error(`Fetch project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "프로젝트 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE 핸들러: 특정 프로젝트 및 관련 OCI 이미지 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params; // GET과 달리 await 필요 없음

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 1. 프로젝트와 관련 이미지 정보 조회 (url 포함)
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        images: {
          select: { url: true }, // OCI 객체 식별을 위해 URL만 선택
        },
      },
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { message: "삭제할 프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. OCI 객체 이름 추출 및 삭제
    const objectDeletionPromises = projectToDelete.images.map((image) => {
      try {
        const urlParts = image.url.split("/o/");
        if (urlParts.length < 2) {
          console.warn(
            `Invalid OCI URL format, cannot extract object name: ${image.url}`
          );
          return Promise.resolve({
            status: "rejected",
            reason: `Invalid URL format: ${image.url}`,
          });
        }
        const objectName = urlParts[1]; // URL의 마지막 부분이 객체 이름
        return deleteObject(objectName);
      } catch (e) {
        console.error(
          `Error preparing object deletion for URL ${image.url}:`,
          e
        );
        return Promise.resolve({
          status: "rejected",
          reason: `Error processing URL ${image.url}`,
        }); // 개별 에러 처리
      }
    });

    // 3. 모든 OCI 객체 삭제 시도 (Promise.allSettled 사용)
    const deletionResults = await Promise.allSettled(objectDeletionPromises);

    // 4. OCI 삭제 결과 로깅
    deletionResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(
          `Failed to delete OCI object derived from URL ${projectToDelete.images[index].url}:`,
          result.reason
        );
      }
    });

    // 5. 데이터베이스에서 프로젝트 삭제 (Image 레코드는 Cascade로 자동 삭제됨)
    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    // 6. 최종 성공 응답
    return NextResponse.json(
      { message: "프로젝트 및 관련 이미지가 삭제되었습니다." },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Delete project ${projectId} API error:`, error);
    // 데이터베이스 삭제 오류 등 처리
    return NextResponse.json(
      { message: "프로젝트 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// TODO: 프로젝트 수정(PUT), 삭제(DELETE) 핸들러 추가 (필요시)
