import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

// GET 핸들러: 파일 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; fileId: string }> }
) {
  try {
    const { projectId, fileId } = await params;
    const { searchParams } = new URL(request.url);
    const variantLabel = searchParams.get("variant"); // 이미지 variant 선택 (선택적)

    // 파일 정보 조회
    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        projectId: projectId,
      },
    });

    if (!file) {
      return NextResponse.json(
        { message: "File not found." },
        { status: 404 }
      );
    }

    let downloadUrl: string;
    let filename = file.name;

    if (file.isImage) {
      // 이미지 파일: variant 선택 가능
      const variants = file.variants as ImageVariantData[];

      if (variants.length === 0) {
        return NextResponse.json(
          { message: "No downloadable image variant available." },
          { status: 404 }
        );
      }

      // variant 선택 또는 기본값 (original 또는 첫 번째)
      const selectedVariant = variantLabel
        ? variants.find((v) => v.label === variantLabel)
        : variants.find((v) => v.label === "original") || variants[0];

      if (!selectedVariant) {
        return NextResponse.json(
          { message: `Variant '${variantLabel}' not found.` },
          { status: 404 }
        );
      }

      downloadUrl = selectedVariant.url;

      // 파일명에 variant 정보 추가
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      filename = `${nameWithoutExt}-${selectedVariant.label}.${selectedVariant.format}`;
    } else {
      // 비이미지 파일: 원본 URL 사용
      if (!file.url) {
        return NextResponse.json(
          { message: "No download URL available." },
          { status: 404 }
        );
      }
      downloadUrl = file.url;
    }

    // 스토리지 URL에서 파일 가져오기 (OCI, R2 등 프로바이더에 관계없이 URL로 접근)
    const response = await fetch(downloadUrl);

    if (!response.ok) {
      return NextResponse.json(
        { message: "Failed to fetch the file." },
        { status: 500 }
      );
    }

    const blob = await response.blob();

    // 다운로드 응답 생성
    return new NextResponse(blob, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Content-Length": blob.size.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { message: "An error occurred during download." },
      { status: 500 }
    );
  }
}
