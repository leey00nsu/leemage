import { getCurrentUser } from "@/lib/auth/session-auth";
import { tagSelect } from "@/lib/api/project-tags";
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

  const userId = await getCurrentUser();
  if (!userId) notFound();
  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      projectId,
      status: "COMPLETED",
      project: { userId },
    },
    include: { tags: { select: tagSelect } },
  });

  if (!file) {
    notFound();
  }

  return <FileDetailWidget file={file as FileWithVariants} />;
}
