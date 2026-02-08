import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { StorageAdapter } from "@/lib/storage";
import { attachResponseLogMetadata } from "@/lib/api/request-log-metadata";

interface HandleOtherConfirmInput {
  fileId: string;
  objectName: string;
  fileName: string;
  contentType: string;
  fileSize: number;
  storageAdapter: StorageAdapter;
}

export async function handleOtherConfirm({
  fileId,
  objectName,
  fileName,
  contentType,
  fileSize,
  storageAdapter,
}: HandleOtherConfirmInput): Promise<NextResponse> {
  const objectUrl = storageAdapter.getObjectUrl(objectName);

  const savedFile = await prisma.file.update({
    where: { id: fileId },
    data: {
      name: fileName,
      mimeType: contentType,
      isImage: false,
      size: fileSize,
      url: objectUrl,
      objectName,
      status: "COMPLETED",
      variants: [],
    },
  });

  const response = NextResponse.json(
    {
      message: "파일 업로드 완료",
      file: savedFile,
    },
    { status: 201 },
  );

  attachResponseLogMetadata(response, {
    fileName,
    fileSize,
    contentType,
    fileType: "other",
  });

  return response;
}
