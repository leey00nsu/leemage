import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";

export function Header() {
  const t = useTranslations("Header");

  return (
    <header className="p-4 border-b sticky top-0 bg-background z-40 h-var(--header-height)">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          Leemage
        </Link>
        <nav className="flex items-center space-x-4">
          <Link
            href="/projects"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            {t("projectsLink")}
          </Link>
          <Link
            href="/api-docs"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            {t("apiDocsLink")}
          </Link>
          <Link
            href="/account"
            className="text-sm font-medium text-muted-foreground hover:text-primary"
          >
            {t("accountLink")}
          </Link>
          <LanguageSelectorButton />
        </nav>
      </div>
    </header>
  );
}
