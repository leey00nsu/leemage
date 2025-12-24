"use client";

import { useTranslations } from "next-intl";
import { useStorageUsage } from "../model/use-storage-usage";
import { formatBytes } from "@/shared/lib/format-bytes";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { HardDrive, FolderOpen, FileText, AlertCircle } from "lucide-react";

interface StorageUsageCardProps {
    className?: string;
}

export function StorageUsageCard({ className }: StorageUsageCardProps) {
    const t = useTranslations("StorageUsageCard");
    const { data, isLoading, error } = useStorageUsage();

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        {t("title")}
                    </CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardDrive className="h-5 w-5" />
                        {t("title")}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        <span>{t("error")}</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive className="h-5 w-5" />
                    {t("title")}
                </CardTitle>
                <CardDescription>{t("description")}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Total Usage */}
                    <div className="rounded-lg border p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                            {t("totalUsage")}
                        </div>
                        <div className="text-2xl font-bold">
                            {formatBytes(data?.total.bytes ?? 0)}
                        </div>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
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

                    {/* Per Provider Usage */}
                    {data?.providers && data.providers.length > 0 && (
                        <div className="grid gap-3">
                            {data.providers.map((provider) => (
                                <div
                                    key={provider.provider}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <div>
                                        <div className="font-medium">
                                            {provider.provider === "OCI"
                                                ? t("ociStorage")
                                                : t("r2Storage")}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {provider.projects} {t("projects")} · {provider.files}{" "}
                                            {t("files")}
                                        </div>
                                    </div>
                                    <div className="text-right font-mono">
                                        {formatBytes(provider.bytes)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No data state */}
                    {(!data?.providers || data.providers.length === 0) && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            {t("noData")}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
