import { Link } from "@/i18n/navigation";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { User } from "lucide-react";
import { AppLogo } from "@/shared/ui/app/app-logo";
import { MobileNavigation } from "./mobile-navigation";

interface HeaderProps {
  className?: string;
  labels: {
    projectsLink: string;
    apiDocsLink: string;
    apiSecurityLink: string;
    logsLink: string;
    accountLink: string;
    menu: string;
  };
}

export function Header({ className = "", labels }: HeaderProps) {
  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <AppLogo size={40} />
          <span className="text-xl font-bold ">Leemage</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/projects"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {labels.projectsLink}
          </Link>
          <Link
            href="/api-docs"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {labels.apiDocsLink}
          </Link>
        </nav>

        {/* Language selector and Auth */}
        <div className="flex items-center space-x-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNavigation labels={labels} />
          </div>
          <LanguageSelectorButton />
          <div className="hidden md:flex w-5 h-5 items-center justify-center">
            <Link
              href="/account"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={labels.accountLink}
            >
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
