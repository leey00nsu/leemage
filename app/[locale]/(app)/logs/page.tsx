import { getTranslations } from "next-intl/server";
import { getSessionDefault } from "@/lib/session";
import { redirect } from "next/navigation";
import { ApiLogsDashboard } from "@/features/api-stats/ui/api-stats-dashboard";

export async function generateMetadata() {
  const t = await getTranslations("ApiLogs");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function LogsPage() {
  const session = await getSessionDefault();

  // 로그인하지 않은 경우 로그인 페이지로 리디렉션
  if (!session?.username) {
    redirect("/auth/login");
  }

  const t = await getTranslations("ApiLogs");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("pageDescription")}</p>
      </div>
      <ApiLogsDashboard />
    </div>
  );
}
