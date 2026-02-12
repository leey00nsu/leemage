"use client";

import { Folder, FolderOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { StorageProvider } from "@/lib/storage/types";
import { cn } from "@/shared/lib/utils";
import { StorageProviderBadge } from "@/shared/ui/storage-provider-badge";
import { AppAssetCard } from "@/shared/ui/app/app-asset-card";

interface AppProjectCardProps {
  className?: string;
  description?: string | null;
  fileCount?: number;
  layout?: "grid" | "list";
  name: string;
  storageProvider?: StorageProvider | string;
  updatedAt?: string | Date;
}

function formatUpdatedAt(
  value: string | Date | undefined,
  locale: string,
  layout: "grid" | "list",
): string | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  const formatter = new Intl.DateTimeFormat(
    locale === "ko" ? "ko-KR" : "en-US",
    layout === "list"
      ? {
          year: "numeric",
          month: "short",
          day: "2-digit",
        }
      : {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        },
  );

  return formatter.format(parsed);
}

export function AppProjectCard({
  className,
  description,
  fileCount = 0,
  layout = "grid",
  name,
  storageProvider,
  updatedAt,
}: AppProjectCardProps) {
  const t = useTranslations("ProjectCard");
  const locale = useLocale();
  const formattedUpdatedAt = formatUpdatedAt(updatedAt, locale, layout);

  if (layout === "list") {
    return (
      <AppAssetCard className={cn("flex-row overflow-hidden", className)}>
        <div className="relative h-24 w-24 shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <FolderOpen className="h-8 w-8 text-slate-400" />
        </div>

        <div className="min-w-0 flex-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">
              {name}
            </h3>
            {storageProvider ? (
              <StorageProviderBadge provider={storageProvider} showLabel={false} size="sm" />
            ) : null}
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
            {description || t("noDescription")}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span className="shrink-0 whitespace-nowrap">
              {t("filesCount", { count: fileCount })}
            </span>
            <span className="text-right">
              {t("lastUpdated", {
                date: formattedUpdatedAt || t("unknownUpdatedAt"),
              })}
            </span>
          </div>
        </div>
      </AppAssetCard>
    );
  }

  return (
    <AppAssetCard className={className}>
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Folder className="h-12 w-12 text-slate-400" />
        {storageProvider ? (
          <div className="absolute right-2 top-2">
            <StorageProviderBadge provider={storageProvider} showLabel={false} size="sm" />
          </div>
        ) : null}
      </div>

      <div className="p-3">
        <div className="truncate text-sm font-medium text-slate-900 dark:text-white" title={name}>
          {name}
        </div>
        <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <div>{t("filesCount", { count: fileCount })}</div>
          <div className="truncate">
            {t("lastUpdated", {
              date: formattedUpdatedAt || t("unknownUpdatedAt"),
            })}
          </div>
        </div>
      </div>
    </AppAssetCard>
  );
}
