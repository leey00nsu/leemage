import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { FileDetailWidget } from "@/widgets/file/ui/file-detail-widget";
import { FileWithVariants } from "@/entities/files/model/types";

interface ProjectFileDetailPageProps {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
}

export default async function ProjectFileDetailPage({
  params,
}: ProjectFileDetailPageProps) {
  const { projectId, fileId } = await params;

  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!file) {
    notFound();
  }

  return <FileDetailWidget file={file as FileWithVariants} />;
}
