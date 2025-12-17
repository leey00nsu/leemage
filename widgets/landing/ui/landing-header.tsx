"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface LandingHeaderProps {
  className?: string;
}

export function LandingHeader({ className = "" }: LandingHeaderProps) {
  const t = useTranslations("LandingHeader");
  const tHeader = useTranslations("Header");
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
          <span className="text-xl font-bold ">
            Leemage
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/projects"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tHeader("projectsLink")}
          </Link>
          <Link
            href="/api-docs"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {tHeader("apiDocsLink")}
          </Link>
        </nav>

        {/* Language selector and Auth */}
        <div className="flex items-center space-x-4">
          <LanguageSelectorButton />
          {isLoggedIn === true && (
            <Link
              href="/account"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={tHeader("accountLink")}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          {isLoggedIn === false && (
            <Link
              href="/auth/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label={t("signIn")}
            >
              <User className="h-5 w-5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
