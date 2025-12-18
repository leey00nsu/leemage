"use client";

import { useTranslations } from "next-intl";
import { GitHubIcon } from "@/shared/ui/icons/tech-icons";

export function Footer() {
    const t = useTranslations("Footer");
    return (
        <footer className="p-4 border-t mt-auto">
            <div className="container mx-auto flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>{t("copyright")}</span>
                <a
                    href="https://github.com/leey00nsu/leemage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors"
                    aria-label="GitHub"
                >
                    <GitHubIcon className="h-5 w-5" />
                </a>
            </div>
        </footer>
    );
}
