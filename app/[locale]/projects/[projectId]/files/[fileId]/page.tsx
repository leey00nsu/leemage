import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FileDetailWidget } from "@/widgets/file/ui/file-detail-widget";
import { FileWithVariants } from "@/entities/files/model/types";

interface FileDetailPageProps {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
}

export default async function FileDetailPage({ params }: FileDetailPageProps) {
  const { fileId } = await params;

  // 서버 컴포넌트에서 직접 데이터베이스 조회
  const file = await prisma.image.findUnique({
    where: { id: fileId },
  });

  // 파일이 없을 경우 404 페이지 표시
  if (!file) {
    notFound();
  }

  return <FileDetailWidget file={file as FileWithVariants} />;
}
