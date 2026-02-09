"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/utils";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppSelect } from "@/shared/ui/app/app-select";

type ThemeValue = "light" | "dark" | "system";

interface ThemeOption {
  icon: ComponentType<{ className?: string }>;
  labelKey: "light" | "dark" | "system";
  value: ThemeValue;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: "light", labelKey: "light", icon: Sun },
  { value: "dark", labelKey: "dark", icon: Moon },
  { value: "system", labelKey: "system", icon: Monitor },
];

interface ThemeSelectorProps {
  className?: string;
  mode?: "compact" | "buttons";
}

export function ThemeSelector({ className, mode = "compact" }: ThemeSelectorProps) {
  const t = useTranslations("ThemeSelector");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeValue =
    mounted && (theme === "light" || theme === "dark" || theme === "system")
      ? theme
      : "system";

  if (mode === "buttons") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const active = currentTheme === option.value;

          return (
            <AppButton
              key={option.value}
              type="button"
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(option.value)}
              className="gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" />
              {t(option.labelKey)}
            </AppButton>
          );
        })}
      </div>
    );
  }

  return (
    <AppSelect
      className={cn("w-full", className)}
      value={currentTheme}
      onChange={(value) => setTheme(value as ThemeValue)}
      options={THEME_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      }))}
      aria-label={t("ariaLabel")}
    />
  );
}
