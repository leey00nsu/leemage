import { getTranslations } from "next-intl/server";
import { MonitoringDashboard } from "@/features/monitoring/ui/monitoring-dashboard";

export async function generateMetadata() {
  const t = await getTranslations("Monitoring");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default async function MonitoringPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-2 sm:px-4 py-4">
      <MonitoringDashboard />
    </div>
  );
}

