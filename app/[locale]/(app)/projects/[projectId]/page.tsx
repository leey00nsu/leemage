import { redirect } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { ProjectDetailsWidget } from "@/widgets/project/ui/project-detail-widget";
import { getLocale } from "next-intl/server";

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const locale = await getLocale();

  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  const { projectId } = await params;

  return <ProjectDetailsWidget projectId={projectId} />;
}
