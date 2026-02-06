"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";

import type { LogEntry } from "@/features/api-stats/model/types";
import { AppTable, AppTableCard } from "@/shared/ui/app/app-table";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppIconButton } from "@/shared/ui/app/app-icon-button";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { AppStatusPill } from "@/shared/ui/app/app-status-pill";
import { formatEndpoint } from "@/features/monitoring/lib/monitoring-utils";

interface MonitoringLogsTableProps {
  logs: LogEntry[];
  totalLogs: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function MonitoringLogsTable({
  logs,
  totalLogs,
  searchQuery,
  onSearchChange,
}: MonitoringLogsTableProps) {
  const t = useTranslations("Monitoring");
  const router = useRouter();

  const handleRowClick = (logId: string) => {
    router.push(`/monitoring/${logId}`);
  };

  return (
    <AppTableCard
      heading={t("table.title")}
      actions={
        <>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
            <AppInput
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t("table.searchPlaceholder")}
              className="pl-8 pr-3 py-1.5 text-xs w-48"
            />
          </div>
          <AppIconButton aria-label={t("table.filter")}>
            <Filter className="h-4 w-4" />
          </AppIconButton>
          <AppIconButton aria-label={t("table.download")}>
            <Download className="h-4 w-4" />
          </AppIconButton>
        </>
      }
      footer={
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t("table.showing", {
              shown: logs.length,
              total: totalLogs,
            })}
          </span>
          <div className="flex items-center gap-2">
            <AppIconButton disabled aria-label={t("table.prev")}>
              <ChevronLeft className="h-4 w-4" />
            </AppIconButton>
            <AppIconButton disabled aria-label={t("table.next")}>
              <ChevronRight className="h-4 w-4" />
            </AppIconButton>
          </div>
        </div>
      }
    >
      <AppTable>
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
          <tr>
            <th className="px-6 py-3 whitespace-nowrap">{t("table.timestamp")}</th>
            <th className="px-6 py-3 whitespace-nowrap">{t("table.method")}</th>
            <th className="px-6 py-3 whitespace-nowrap">{t("table.endpoint")}</th>
            <th className="px-6 py-3 whitespace-nowrap">{t("table.status")}</th>
            <th className="px-6 py-3 whitespace-nowrap text-right">
              {t("table.latency")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50 text-slate-700 dark:text-slate-300">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-500">
                {t("table.empty")}
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const formattedTime = new Date(log.createdAt).toLocaleString();
              const displayEndpoint = formatEndpoint(log.endpoint, log.metadata);
              return (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(log.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRowClick(log.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">
                    {formattedTime}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <AppMethodBadge method={log.method} />
                  </td>
                  <td
                    className="px-6 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap"
                    title={log.endpoint}
                  >
                    {displayEndpoint}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    <AppStatusPill statusCode={log.statusCode} />
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-xs whitespace-nowrap">
                    {log.durationMs ? `${log.durationMs}ms` : "-"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </AppTable>
    </AppTableCard>
  );
}

