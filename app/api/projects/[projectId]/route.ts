import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteObject } from "@/lib/oci"; // OCI 삭제 함수 임포트
import { ImageVariantData } from "./images/route";

// GET 핸들러: 특정 프로젝트 정보 및 포함된 이미지 목록(variants 포함) 조회
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
          select: {
            // 필요한 필드만 선택
            id: true,
            name: true,
            variants: true, // variants 필드 명시적 포함
            createdAt: true,
            updatedAt: true,
            projectId: true,
          },
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

    // 이미지 variants 타입 변환 (Prisma.JsonValue -> 원하는 타입 배열)
    // 클라이언트 측 타입과 일치시키기 위함 (선택적이지만 권장)
    const processedProject = {
      ...project,
      images: project.images.map((img) => ({
        ...img,
        // Prisma.JsonValue를 ImageVariantData[] 타입으로 가정하고 변환 시도
        // 실제 타입 검증/변환 로직 추가 가능
        variants: img.variants as ImageVariantData[], // variants를 ImageVariantData[] 타입으로 변환
      })),
    };

    return NextResponse.json(processedProject);
  } catch (error) {
    console.error(`Fetch project ${projectId} API error:`, error);
    return NextResponse.json(
      { message: "프로젝트 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE 핸들러: 특정 프로젝트 및 관련 OCI 이미지(모든 variants) 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    // 1. 프로젝트와 관련 이미지 정보 조회 (variants 포함)
    const projectToDelete = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        images: {
          select: { id: true, name: true, variants: true }, // variants 포함
        },
      },
    });

    if (!projectToDelete) {
      return NextResponse.json(
        { message: "삭제할 프로젝트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 2. 모든 이미지의 모든 variants에서 OCI 객체 이름 추출 및 삭제 준비
    const objectDeletionPromises: Promise<void>[] = [];
    projectToDelete.images.forEach((image) => {
      const variants = image.variants as ImageVariantData[]; // ImageVariantData[] 타입으로 변경
      variants.forEach((variant) => {
        if (typeof variant?.url === "string") {
          try {
            const urlParts = variant.url.split("/o/");
            if (urlParts.length < 2) {
              console.warn(`Invalid OCI URL format in variant: ${variant.url}`);
              return; // 다음 variant로 넘어감
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

    // 3. 모든 OCI 객체 삭제 시도 (Promise.allSettled 사용)
    const deletionResults = await Promise.allSettled(objectDeletionPromises);

    // 4. OCI 삭제 결과 로깅
    deletionResults.forEach((result, index) => {
      // index 사용 대신 URL 직접 로깅 고려
      if (result.status === "rejected") {
        console.error(
          `Failed to delete OCI object (index ${index}):`, // 어떤 객체인지 식별 어려움 개선 필요
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
      { message: "프로젝트 및 관련 이미지(모든 버전)가 삭제되었습니다." },
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
