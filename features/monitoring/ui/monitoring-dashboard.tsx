"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { DateRange } from "react-day-picker";

import { useApiStats } from "@/features/api-stats/model/use-api-stats";
import { useGetProjects } from "@/features/projects/list/model/get";
import { MonitoringHeader } from "@/features/monitoring/ui/monitoring-header";
import { MonitoringKpiGrid } from "@/features/monitoring/ui/monitoring-kpi-grid";
import { MonitoringFiltersBar } from "@/features/monitoring/ui/monitoring-filters-bar";
import { MonitoringRequestChart } from "@/features/monitoring/ui/monitoring-request-chart";
import { MonitoringLogsTable } from "@/features/monitoring/ui/monitoring-logs-table";
import { MonitoringSkeleton } from "@/features/monitoring/ui/monitoring-skeleton";
import { createDateRange } from "@/features/monitoring/lib/monitoring-utils";
import { MethodFilter, StatusFilter } from "@/features/monitoring/model/filters";
import { AppCard } from "@/shared/ui/app/app-card";

export function MonitoringDashboard() {
  const t = useTranslations("Monitoring");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("all");
  const [dateRange, setDateRange] = useState(() => createDateRange(7));
  const [selectedQuickRange, setSelectedQuickRange] = useState<number | null>(7);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects } = useGetProjects();
  const { data, isLoading, error } = useApiStats(
    selectedProjectId === "all" ? undefined : selectedProjectId,
    dateRange.from,
    dateRange.to
  );

  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    return data.logs.filter((log) => {
      if (
        statusFilter === "success" &&
        (log.statusCode < 200 || log.statusCode >= 400)
      ) {
        return false;
      }
      if (
        statusFilter === "error" &&
        log.statusCode >= 200 &&
        log.statusCode < 400
      ) {
        return false;
      }
      if (methodFilter !== "all" && log.method !== methodFilter) {
        return false;
      }
      if (
        searchQuery &&
        !log.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data?.logs, statusFilter, methodFilter, searchQuery]);

  const availableMethods = useMemo(() => {
    if (!data?.logs) return new Set<string>();
    return new Set(data.logs.map((log) => log.method));
  }, [data?.logs]);

  const chartData = useMemo(() => {
    return (data?.byTime ?? []).map((item) => ({
      label: item.label,
      total: item.success + item.error,
      error: item.error,
      errorRate:
        item.success + item.error > 0
          ? (item.error / (item.success + item.error)) * 100
          : 0,
    }));
  }, [data?.byTime]);

  const totalLogs = data?.logs.length ?? 0;

  const handleQuickRange = (days: number) => {
    setDateRange(createDateRange(days));
    setSelectedQuickRange(days);
    setTempRange(undefined);
  };

  const handleCustomRange = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      const from = new Date(range.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(range.to);
      to.setHours(23, 59, 59, 999);
      setDateRange({ from, to });
      setSelectedQuickRange(null);
      setCalendarOpen(false);
    }
  };

  if (isLoading) {
    return <MonitoringSkeleton />;
  }

  if (error || !data) {
    return (
      <AppCard className="p-10 text-center text-muted-foreground">
        {t("table.empty")}
      </AppCard>
    );
  }

  return (
    <div className="space-y-6">
      <MonitoringHeader
        dateRange={dateRange}
        selectedQuickRange={selectedQuickRange}
        calendarOpen={calendarOpen}
        onCalendarOpenChange={setCalendarOpen}
        onQuickRange={handleQuickRange}
        tempRange={tempRange}
        onTempRangeChange={handleCustomRange}
      />
      <MonitoringKpiGrid summary={data.summary} />
      <MonitoringFiltersBar
        projects={projects}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        methodFilter={methodFilter}
        onMethodChange={setMethodFilter}
        availableMethods={availableMethods}
      />
      <MonitoringRequestChart data={chartData} />
      <MonitoringLogsTable
        logs={filteredLogs}
        totalLogs={totalLogs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
}

