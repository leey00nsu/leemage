import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadObject } from "@/lib/oci";
import cuid from "cuid";

// Helper to convert ReadablStream<Uint8Array> to Buffer
async function streamToBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const projectId = params.projectId;

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { message: "파일이 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 파일 정보 준비
    const fileBuffer = await streamToBuffer(file.stream());
    const fileExtension = file.name.split(".").pop() || "bin";
    const objectName = `${projectId}/${cuid()}.${fileExtension}`;
    const fileSize = file.size;
    const fileType = file.type.split("/")[1] || fileExtension;
    const fileMimeType = file.type;

    // 2. OCI 업로드 (lib/oci.ts의 함수 사용)
    console.log(`Uploading ${objectName} via uploadObject function...`);
    const objectUrl = await uploadObject(objectName, fileBuffer, fileMimeType);
    console.log(`Successfully uploaded. Object URL: ${objectUrl}`);

    // 3. 데이터베이스에 이미지 정보 저장
    const newImage = await prisma.image.create({
      data: {
        name: file.name,
        url: objectUrl,
        size: fileSize,
        format: fileType,
        projectId: projectId,
      },
    });

    console.log("Image metadata saved to DB:", newImage);

    // 4. 성공 응답 반환
    return NextResponse.json(newImage, { status: 201 });
  } catch (error: unknown) {
    console.error("Image upload API error:", error);
    let errorMessage = "이미지 업로드 중 오류가 발생했습니다.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
