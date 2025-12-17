import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="p-4 border-t mt-auto">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        {t("copyright")}
      </div>
    </footer>
  );
}
