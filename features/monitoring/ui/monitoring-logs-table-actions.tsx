"use client";

import { Download, Filter, Search } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppIconButton } from "@/shared/ui/app/app-icon-button";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppSelect } from "@/shared/ui/app/app-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import type {
  AdvancedLogFilters,
  StatusCodeClassFilter,
} from "@/features/monitoring/model/filters";

interface MonitoringLogsTableActionsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  advancedFilters: AdvancedLogFilters;
  onAdvancedFiltersChange: (next: AdvancedLogFilters) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (next: number) => void;
}

const STATUS_CLASS_OPTIONS: StatusCodeClassFilter[] = ["2xx", "3xx", "4xx", "5xx"];
const ROWS_PER_PAGE_OPTIONS = [25, 50, 100] as const;

export function MonitoringLogsTableActions({
  searchQuery,
  onSearchChange,
  advancedFilters,
  onAdvancedFiltersChange,
  rowsPerPage,
  onRowsPerPageChange,
}: MonitoringLogsTableActionsProps) {
  const t = useTranslations("Monitoring");

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.statusCodeClasses.length > 0) count += 1;
    if (typeof advancedFilters.latencyMinMs === "number") count += 1;
    if (typeof advancedFilters.latencyMaxMs === "number") count += 1;
    if (advancedFilters.metadataKeyword.trim()) count += 1;
    return count;
  }, [advancedFilters]);

  const toggleStatusCodeClass = (statusClass: StatusCodeClassFilter) => {
    const nextSet = new Set(advancedFilters.statusCodeClasses);
    if (nextSet.has(statusClass)) {
      nextSet.delete(statusClass);
    } else {
      nextSet.add(statusClass);
    }

    onAdvancedFiltersChange({
      ...advancedFilters,
      statusCodeClasses: STATUS_CLASS_OPTIONS.filter((item) => nextSet.has(item)),
    });
  };

  const handleLatencyInput = (key: "latencyMinMs" | "latencyMaxMs", rawValue: string) => {
    const trimmed = rawValue.trim();
    const parsed = trimmed === "" ? undefined : Number(trimmed);
    onAdvancedFiltersChange({
      ...advancedFilters,
      [key]:
        typeof parsed === "number" && Number.isFinite(parsed)
          ? Math.max(0, Math.floor(parsed))
          : undefined,
    });
  };

  const resetAdvancedFilters = () => {
    onAdvancedFiltersChange({
      statusCodeClasses: [],
      metadataKeyword: "",
    });
  };

  return (
    <>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <AppInput
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("table.searchPlaceholder")}
          className="w-48 px-3 py-1.5 pl-8 pr-3 text-xs"
        />
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <AppIconButton aria-label={t("table.filter")} className="relative">
            <Filter className="h-4 w-4" />
            {activeAdvancedFilterCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-white">
                {activeAdvancedFilterCount}
              </span>
            ) : null}
          </AppIconButton>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("table.rowsPerPage")}
            </p>
            <AppSelect
              value={String(rowsPerPage)}
              onChange={(value) => onRowsPerPageChange(Number(value))}
              options={ROWS_PER_PAGE_OPTIONS.map((size) => ({
                value: String(size),
                label: String(size),
              }))}
              aria-label={t("table.rowsPerPage")}
              triggerClassName="h-8 w-full text-xs"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("table.advancedFilters.statusCodeClass")}
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_CLASS_OPTIONS.map((statusClass) => {
                const selected = advancedFilters.statusCodeClasses.includes(statusClass);
                return (
                  <AppButton
                    key={statusClass}
                    variant={selected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleStatusCodeClass(statusClass)}
                  >
                    {statusClass}
                  </AppButton>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("table.advancedFilters.latencyRange")}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AppInput
                type="number"
                min={0}
                value={advancedFilters.latencyMinMs ?? ""}
                onChange={(event) =>
                  handleLatencyInput("latencyMinMs", event.target.value)
                }
                placeholder={t("table.advancedFilters.minMs")}
                className="h-8 px-3 py-1 text-xs"
              />
              <AppInput
                type="number"
                min={0}
                value={advancedFilters.latencyMaxMs ?? ""}
                onChange={(event) =>
                  handleLatencyInput("latencyMaxMs", event.target.value)
                }
                placeholder={t("table.advancedFilters.maxMs")}
                className="h-8 px-3 py-1 text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("table.advancedFilters.metadataKeyword")}
            </p>
            <AppInput
              value={advancedFilters.metadataKeyword}
              onChange={(event) =>
                onAdvancedFiltersChange({
                  ...advancedFilters,
                  metadataKeyword: event.target.value,
                })
              }
              placeholder={t("table.advancedFilters.metadataPlaceholder")}
              className="h-8 px-3 py-1 text-xs"
            />
          </div>

          <div className="flex justify-end">
            <AppButton variant="outline" size="sm" onClick={resetAdvancedFilters}>
              {t("table.advancedFilters.reset")}
            </AppButton>
          </div>
        </PopoverContent>
      </Popover>
      <AppIconButton aria-label={t("table.download")}>
        <Download className="h-4 w-4" />
      </AppIconButton>
    </>
  );
}
