import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";

export function Header() {
  const t = useTranslations("Header");

  return (
    <header className="p-4 border-b sticky top-0 bg-background z-40 h-var(--header-height)">
      <div className="container mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center w-10 h-10">
          <Image
            src="/logo.webp"
            alt="Leemage"
            width={100}
            height={100}
            className="object-contain"
          />
          <span className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-black to-gray-500">
            Leemage
          </span>
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
