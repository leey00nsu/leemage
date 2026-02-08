"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { AppDrawer } from "@/shared/ui/app/app-drawer";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { AppStatusPill } from "@/shared/ui/app/app-status-pill";
import { AppCodeBlock } from "@/shared/ui/app/app-code-block";
import { formatBytes } from "@/shared/lib/format-bytes";
import type { MonitoringLogDetail } from "@/features/monitoring/model/types";
import { resolveMonitoringLogActor } from "@/features/monitoring/lib/log-actor";

interface MonitoringLogDrawerProps {
  log: MonitoringLogDetail;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  backHref?: string;
}

export function MonitoringLogDrawer({
  log,
  open = true,
  onOpenChange,
  backHref,
}: MonitoringLogDrawerProps) {
  const t = useTranslations("Monitoring");
  const router = useRouter();

  const logLabel = useMemo(() => `LOG-${log.id.slice(0, 6).toUpperCase()}`, [log.id]);
  const actor = useMemo(
    () =>
      resolveMonitoringLogActor(log, {
        uiLabel: t("drawer.sources.ui"),
        unknownApiKeyLabel: t("drawer.unknownApiKey"),
      }),
    [log, t],
  );

  const metadata = useMemo(() => {
    if (!log.metadata || typeof log.metadata !== "object") return null;
    return log.metadata as Record<string, unknown>;
  }, [log.metadata]);

  const metadataEntries = useMemo(() => {
    if (!metadata) return [];
    return Object.entries(metadata).filter(([key]) => key !== "thumbnailUrl");
  }, [metadata]);

  const thumbnailUrl = metadata?.thumbnailUrl;

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
      return;
    }

    if (!open) {
      if (backHref) {
        router.push(backHref);
      } else {
        router.back();
      }
    }
  };

  return (
    <AppDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title={t("drawer.title")}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center px-6 pr-14 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
              {t("drawer.title")}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {logLabel}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-5">
              {t("drawer.summary")}
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <DetailItem label={t("drawer.method")}>
                <AppMethodBadge method={log.method} />
              </DetailItem>
              <DetailItem label={t("drawer.status")}>
                <AppStatusPill statusCode={log.statusCode} />
              </DetailItem>
              <DetailItem label={t("drawer.latency")}>
                <span className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
                  {log.durationMs ? `${log.durationMs}ms` : "-"}
                </span>
              </DetailItem>
              <DetailItem label={t("drawer.timestamp")}>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </DetailItem>
              <DetailItem label={t("drawer.source")}>
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t(`drawer.sources.${actor.type}`)}
                </span>
              </DetailItem>
              <DetailItem label={t("drawer.apiKey")}>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  {actor.type === "apiKey" ? actor.label : "-"}
                </span>
              </DetailItem>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/50 flex flex-col gap-2">
              <span className="text-xs text-slate-500">{t("drawer.endpoint")}</span>
              <span
                className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all"
                title={log.endpoint}
              >
                {log.endpoint}
              </span>
            </div>
            {log.projectId && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                <DetailItem label={t("drawer.projectId")}>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
                    {log.projectId}
                  </span>
                </DetailItem>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-semibold text-slate-900 dark:text-white mb-3">
              {t("drawer.metadata")}
            </h3>
            {metadata ? (
              <div className="space-y-4">
                {typeof thumbnailUrl === "string" && thumbnailUrl && (
                  <div className="flex justify-center">
                    <img
                      src={thumbnailUrl}
                      alt="thumbnail"
                      className="max-h-32 rounded object-contain"
                    />
                  </div>
                )}
                {metadataEntries.length > 0 && (
                  <div className="space-y-2">
                    {metadataEntries.map(([key, value]) => {
                      const displayValue =
                        key === "fileSize" && typeof value === "number"
                          ? formatBytes(value)
                          : typeof value === "string"
                          ? value
                          : JSON.stringify(value);
                      return (
                        <div
                          key={key}
                          className="grid grid-cols-[auto_1fr] items-start gap-x-3 text-xs text-slate-600 dark:text-slate-400"
                        >
                          <span className="uppercase tracking-wide pt-0.5">{key}</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 justify-self-end text-right whitespace-pre-wrap break-all">
                            {displayValue}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <AppCodeBlock>
                  {JSON.stringify(metadata, null, 2)}
                </AppCodeBlock>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("drawer.noMetadata")}
              </p>
            )}
          </div>
        </div>
      </div>
    </AppDrawer>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </div>
  );
}
