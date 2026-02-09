import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSessionDefault } from "@/lib/session";

export default async function DashboardPage() {
  const locale = await getLocale();

  const session = await getSessionDefault();
  if (!session?.username) {
    redirect({ href: "/auth/login", locale });
  }

  redirect({ href: "/projects", locale });
}
