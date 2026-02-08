"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppIconButton } from "@/shared/ui/app/app-icon-button";

interface MonitoringLogsTableFooterProps {
  totalLogs: number;
  logsLength: number;
  rowsPerPage: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (next: number) => void;
}

export function MonitoringLogsTableFooter({
  totalLogs,
  logsLength,
  rowsPerPage,
  currentPage,
  totalPages,
  onPageChange,
}: MonitoringLogsTableFooterProps) {
  const t = useTranslations("Monitoring");

  const hasVisibleRows = totalLogs > 0 && logsLength > 0;
  const rangeStart = hasVisibleRows ? (currentPage - 1) * rowsPerPage + 1 : 0;
  const rangeEnd = hasVisibleRows ? rangeStart + logsLength - 1 : 0;

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {t("table.showingRange", {
          start: rangeStart,
          end: rangeEnd,
          total: totalLogs,
        })}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {currentPage}/{totalPages}
        </span>
        <AppIconButton
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label={t("table.prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </AppIconButton>
        <AppIconButton
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label={t("table.next")}
        >
          <ChevronRight className="h-4 w-4" />
        </AppIconButton>
      </div>
    </div>
  );
}
