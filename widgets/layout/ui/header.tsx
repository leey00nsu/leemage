import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";

// 헤더 높이를 상수로 정의 (필요 시 shared/config 등에서 관리)
const HEADER_HEIGHT = "65px";

export function Header() {
  const t = useTranslations("Header");

  return (
    <header
      className="p-4 border-b sticky top-0 bg-background z-10"
      style={{ height: `var(--header-height, ${HEADER_HEIGHT})` }}
    >
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
