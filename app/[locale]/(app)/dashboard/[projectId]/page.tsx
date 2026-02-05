import { redirect } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { ProjectDetailsWidget } from "@/widgets/project/ui/project-detail-widget";
import { getLocale } from "next-intl/server";

interface DashboardProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function DashboardProjectPage({
  params,
}: DashboardProjectPageProps) {
  const locale = await getLocale();

  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  const { projectId } = await params;

  return <ProjectDetailsWidget projectId={projectId} />;
}
