import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

interface DashboardProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DashboardProjectPage({
  params,
}: DashboardProjectPageProps) {
  const locale = await getLocale();
  const { projectId } = await params;

  redirect({ href: `/projects/${projectId}`, locale });
}
