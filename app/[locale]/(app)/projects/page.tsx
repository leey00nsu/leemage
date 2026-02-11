import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppPageHeader } from "@/shared/ui/app/app-page-header";
import { DashboardProjectList } from "@/widgets/dashboard/ui/dashboard-project-list";
import { CreateProjectDialog } from "@/features/projects/create/ui/create-project-dialog";

interface ProjectsPageProps {
  searchParams?: Promise<{
    create?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const locale = await getLocale();
  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const shouldOpenCreateDialog =
    resolvedSearchParams?.create === "1" ||
    resolvedSearchParams?.create === "true";

  const t = await getTranslations("Dashboard");

  return (
    <div className="mx-auto max-w-[1600px] px-2 py-2 sm:px-4">
      <AppPageHeader
        heading={t("title")}
        description={t("description")}
        actions={(
          <CreateProjectDialog defaultOpen={shouldOpenCreateDialog}>
            <AppButton>{t("createProjectButton")}</AppButton>
          </CreateProjectDialog>
        )}
      />
      <div className="mt-6">
        <DashboardProjectList />
      </div>
    </div>
  );
}
