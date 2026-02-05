import { getLocale, getTranslations } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AppButton } from "@/shared/ui/app/app-button";

export default async function DashboardPage() {
  const locale = await getLocale();

  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  const latestProject = await prisma.project.findFirst({
    where: { userId: session.username },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (latestProject) {
    redirect({ href: `/dashboard/${latestProject.id}`, locale });
  }

  const t = await getTranslations("Dashboard");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-2">
          {t("noProjectsDescription")}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/projects/new">
          <AppButton>{t("createProjectButton")}</AppButton>
        </Link>
        <Link href="/projects">
          <AppButton variant="outline">{t("goProjectsButton")}</AppButton>
        </Link>
      </div>
    </div>
  );
}
