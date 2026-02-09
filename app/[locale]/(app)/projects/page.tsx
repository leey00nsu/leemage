import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppPageHeader } from "@/shared/ui/app/app-page-header";
import { DashboardProjectList } from "@/widgets/dashboard/ui/dashboard-project-list";

export default async function ProjectsPage() {
  const locale = await getLocale();
  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  const t = await getTranslations("Dashboard");

  return (
    <div className="mx-auto max-w-[1600px] px-2 py-2 sm:px-4">
      <AppPageHeader
        heading={t("title")}
        description={t("description")}
        actions={(
          <Link href="/projects/new">
            <AppButton>{t("createProjectButton")}</AppButton>
          </Link>
        )}
      />
      <div className="mt-6">
        <DashboardProjectList />
      </div>
    </div>
  );
}
