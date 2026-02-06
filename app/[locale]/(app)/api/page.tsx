import { getTranslations } from "next-intl/server";
import { ApiSecurityDashboard } from "@/features/api-security/ui/api-security-dashboard";

export async function generateMetadata() {
  const t = await getTranslations("ApiSecurity");
  return {
    title: t("pageTitle"),
    description: t("pageDescription"),
  };
}

export default function ApiSecurityPage() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-2 py-4 sm:px-4">
      <ApiSecurityDashboard />
    </div>
  );
}
