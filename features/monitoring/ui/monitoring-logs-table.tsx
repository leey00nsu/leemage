"use client";

import { useTranslations } from "next-intl";
import type { LogEntry } from "@/features/api-stats/model/types";
import { AppTable, AppTableCard } from "@/shared/ui/app/app-table";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { AppStatusPill } from "@/shared/ui/app/app-status-pill";
import {
  buildMonitoringLogDescription,
  stripQuery,
} from "@/features/monitoring/lib/log-description";
import { resolveMonitoringLogActor } from "@/features/monitoring/lib/log-actor";
import type { AdvancedLogFilters } from "@/features/monitoring/model/filters";
import { MonitoringLogsTableActions } from "@/features/monitoring/ui/monitoring-logs-table-actions";
import { MonitoringLogsTableFooter } from "@/features/monitoring/ui/monitoring-logs-table-footer";

interface MonitoringLogsTableProps {
  logs: LogEntry[];
  totalLogs: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  apiKeyNameById: Record<string, string>;
  advancedFilters: AdvancedLogFilters;
  onAdvancedFiltersChange: (next: AdvancedLogFilters) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (next: number) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  onRowClick: (log: LogEntry) => void;
}

export function MonitoringLogsTable({
  logs,
  totalLogs,
  searchQuery,
  onSearchChange,
  apiKeyNameById,
  advancedFilters,
  onAdvancedFiltersChange,
  rowsPerPage,
  onRowsPerPageChange,
  currentPage,
  totalPages,
  onPageChange,
  onRowClick,
}: MonitoringLogsTableProps) {
  const t = useTranslations("Monitoring");

  return (
    <AppTableCard
      heading={t("table.title")}
      actions={
        <MonitoringLogsTableActions
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={onAdvancedFiltersChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      }
      footer={
        <MonitoringLogsTableFooter
          totalLogs={totalLogs}
          logsLength={logs.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      }
    >
      <AppTable>
        <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-gray-800 dark:bg-gray-800 dark:text-slate-400">
          <tr>
            <th className="whitespace-nowrap px-6 py-3">{t("table.timestamp")}</th>
            <th className="whitespace-nowrap px-6 py-3">{t("table.method")}</th>
            <th className="whitespace-nowrap px-6 py-3">{t("table.description")}</th>
            <th className="whitespace-nowrap px-6 py-3">{t("table.status")}</th>
            <th className="whitespace-nowrap px-6 py-3">{t("table.apiKey")}</th>
            <th className="whitespace-nowrap px-6 py-3 text-right">
              {t("table.latency")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-slate-700 dark:divide-gray-800/50 dark:text-slate-300">
          {logs.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-6 text-center text-sm text-slate-500">
                {t("table.empty")}
              </td>
            </tr>
          ) : (
            logs.map((log) => {
              const formattedTime = new Date(log.createdAt).toLocaleString();
              const displayEndpoint = stripQuery(log.endpoint);
              const description = buildMonitoringLogDescription(log, t);
              const actor = resolveMonitoringLogActor(log, {
                apiKeyNameById,
                uiLabel: t("table.ui"),
                unknownApiKeyLabel: t("table.unknownApiKey"),
              });

              return (
                <tr
                  key={log.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50/80 dark:hover:bg-gray-800/30"
                  onClick={() => onRowClick(log)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onRowClick(log);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <td className="whitespace-nowrap px-6 py-3 font-mono text-xs">
                    {formattedTime}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3">
                    <AppMethodBadge method={log.method} />
                  </td>
                  <td
                    className="px-6 py-3 text-xs text-slate-700 dark:text-slate-200"
                    title={log.endpoint}
                  >
                    <p className="font-medium">{description}</p>
                    <p className="mt-1 break-all font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {displayEndpoint}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3">
                    <AppStatusPill statusCode={log.statusCode} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                    {actor.label}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-right font-mono text-xs">
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
