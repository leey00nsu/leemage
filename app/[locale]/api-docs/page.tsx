import { redirect } from "@/i18n/navigation";
import { normalizeLocale } from "./_lib/page-helpers";

interface ApiDocsRootPageProps {
  params: Promise<{ locale: string }>;
}

export default async function ApiDocsRootPage({ params }: ApiDocsRootPageProps) {
  const { locale } = await params;
  redirect({
    locale: normalizeLocale(locale),
    href: "/api-docs/getting-started/introduction",
  });
}
