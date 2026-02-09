import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

interface DashboardFileDetailPageProps {
  params: Promise<{
    projectId: string;
    fileId: string;
  }>;
}

export default async function DashboardFileDetailPage({
  params,
}: DashboardFileDetailPageProps) {
  const locale = await getLocale();
  const { projectId, fileId } = await params;

  redirect({ href: `/projects/${projectId}/files/${fileId}`, locale });
}
