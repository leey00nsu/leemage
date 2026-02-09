"use client";

import { useTranslations } from "next-intl";
import { useStorageUsage } from "../model/use-storage-usage";
import { formatBytes } from "@/shared/lib/format-bytes";
import { calculateRemainingSpace } from "@/shared/lib/storage-quota-utils";
import { Skeleton } from "@/shared/ui/skeleton";
import { AppCard } from "@/shared/ui/app/app-card";
import {
    HardDrive,
    FolderOpen,
    FileText,
    AlertCircle,
    AlertTriangle,
} from "lucide-react";
import { UsageBar } from "./usage-bar";
import { QuotaSettingDialog } from "./quota-setting-dialog";

interface StorageUsageCardProps {
    className?: string;
}

export function StorageUsageCard({ className }: StorageUsageCardProps) {
    const t = useTranslations("StorageUsageCard");
    const { data, isLoading, error } = useStorageUsage();

    if (isLoading) {
        return (
            <AppCard className={className}>
                <div className="p-6 md:p-8">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <HardDrive className="h-5 w-5" />
                        {t("title")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {t("description")}
                    </p>
                    <div className="space-y-4">
                        <Skeleton className="mt-5 h-28 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                </div>
            </AppCard>
        );
    }

    if (error) {
        return (
            <AppCard className={className}>
                <div className="p-6 md:p-8">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <HardDrive className="h-5 w-5" />
                        {t("title")}
                    </h2>
                    <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t("error")}</span>
                    </div>
                </div>
            </AppCard>
        );
    }

    return (
        <AppCard className={className}>
            <div className="p-6 md:p-8">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <HardDrive className="h-5 w-5" />
                    {t("title")}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {t("description")}
                </p>
                <div className="space-y-4">
                    {/* Total Usage */}
                    <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/40">
                        <div className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                            {t("totalUsage")}
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {formatBytes(data?.total.bytes ?? 0)}
                        </div>
                        <div className="mt-2 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <FolderOpen className="h-3 w-3" />
                                {data?.total.projects ?? 0} {t("projects")}
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {data?.total.files ?? 0} {t("files")}
                            </span>
                        </div>
                    </div>

                    {/* Per Provider Usage with Usage Bar */}
                    {data?.providers && data.providers.length > 0 && (
                        <div className="grid gap-3">
                            {data.providers.map((provider) => {
                                const remaining = provider.quota
                                    ? calculateRemainingSpace(provider.quota, provider.bytes)
                                    : undefined;

                                return (
                                    <div
                                        key={provider.provider}
                                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {provider.provider === "OCI"
                                                        ? t("ociStorage")
                                                        : t("r2Storage")}
                                                </span>
                                                <QuotaSettingDialog
                                                    provider={provider.provider}
                                                    currentQuota={provider.quota}
                                                />
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400">
                                                {formatBytes(provider.bytes)}
                                                {provider.quota && (
                                                    <span> / {formatBytes(provider.quota)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Usage Bar */}
                                        <UsageBar
                                            percentage={provider.percentage}
                                            segments={40}
                                        />

                                        {/* Stats */}
                                        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            {provider.projects} {t("projects")} · {provider.files}{" "}
                                            {t("files")}
                                        </div>

                                        {/* Warning Messages */}
                                        {provider.status === "warning" && remaining !== undefined && (
                                            <div className="flex items-center gap-2 mt-3 p-2 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-sm">
                                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                                <span>
                                                    {t("warningMessage", {
                                                        remaining: formatBytes(remaining),
                                                    })}
                                                </span>
                                            </div>
                                        )}
                                        {provider.status === "critical" &&
                                            remaining !== undefined && (
                                                <div className="flex items-center gap-2 mt-3 p-2 rounded bg-red-500/10 text-red-600 dark:text-red-500 text-sm">
                                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                                    <span>
                                                        {t("criticalMessage", {
                                                            remaining: formatBytes(remaining),
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* No data state */}
                    {(!data?.providers || data.providers.length === 0) && (
                        <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                            {t("noData")}
                        </div>
                    )}
                </div>
            </div>
        </AppCard>
    );
}
