import { NotFound as NotFoundWidget } from "@/widgets/not-found/ui/not-found";
import { getTranslations } from "next-intl/server";

export default async function NotFoundPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NotFoundWidget
        locale={locale}
        labels={{
          title: t("title"),
          description: t("description"),
          homeButton: t("homeButton"),
        }}
      />
    </div>
  );
}
