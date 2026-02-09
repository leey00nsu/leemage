"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
import { MobileNavigation } from "./mobile-navigation";

interface HeaderProps {
  className?: string;
}

export function Header({ className = "" }: HeaderProps) {
  const t = useTranslations("Header");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setIsLoggedIn(data.isLoggedIn))
      .catch(() => setIsLoggedIn(false));
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${className}`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/logo.webp"
            alt="Leemage"
            width={40}
            height={40}
            className="object-contain"
          />
          <span className="text-xl font-bold ">Leemage</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/projects"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("projectsLink")}
          </Link>
          <Link
            href="/api-docs"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("apiDocsLink")}
          </Link>
        </nav>

        {/* Language selector and Auth */}
        <div className="flex items-center space-x-4">
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <MobileNavigation isLoggedIn={isLoggedIn} />
          </div>
          <LanguageSelectorButton />
          <div className="hidden md:flex w-5 h-5 items-center justify-center">
            {isLoggedIn === null ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isLoggedIn ? (
              <Link
                href="/account"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("accountLink")}
              >
                <User className="h-5 w-5" />
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label={t("accountLink")}
              >
                <User className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
