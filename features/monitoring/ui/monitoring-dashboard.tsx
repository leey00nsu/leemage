"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useApiStats } from "@/features/api-stats/model/use-api-stats";
import type { LogEntry } from "@/features/api-stats/model/types";
import { useListApiKeys } from "@/features/api-key/model/list";
import { useGetProjects } from "@/features/projects/list/model/get";
import { MonitoringHeader } from "@/features/monitoring/ui/monitoring-header";
import { MonitoringKpiGrid } from "@/features/monitoring/ui/monitoring-kpi-grid";
import { MonitoringFiltersBar } from "@/features/monitoring/ui/monitoring-filters-bar";
import { MonitoringRequestChart } from "@/features/monitoring/ui/monitoring-request-chart";
import { MonitoringLogsTable } from "@/features/monitoring/ui/monitoring-logs-table";
import { MonitoringLogDrawer } from "@/features/monitoring/ui/monitoring-log-drawer";
import { MonitoringSkeleton } from "@/features/monitoring/ui/monitoring-skeleton";
import { resolveMonitoringLogActor } from "@/features/monitoring/lib/log-actor";
import { useMonitoringDashboardState } from "@/features/monitoring/model/use-monitoring-dashboard-state";
import type { MonitoringLogDetail } from "@/features/monitoring/model/types";
import type { ActorFilter } from "@/features/monitoring/model/filters";
import { AppCard } from "@/shared/ui/app/app-card";

function toMonitoringLogDetail(log: LogEntry): MonitoringLogDetail {
  return {
    id: log.id,
    endpoint: log.endpoint,
    method: log.method,
    statusCode: log.statusCode,
    durationMs: log.durationMs,
    createdAt: log.createdAt,
    metadata: log.metadata ?? null,
    projectId: log.projectId ?? null,
  };
}

export function MonitoringDashboard() {
  const t = useTranslations("Monitoring");
  const [selectedLog, setSelectedLog] = useState<MonitoringLogDetail | null>(null);

  const { data: projects } = useGetProjects();
  const { data: apiKeys } = useListApiKeys();
  const state = useMonitoringDashboardState();
  const projectOptions = useMemo(
    () =>
      (projects ?? []).map((project) => ({
        value: project.id,
        label: project.name,
      })),
    [projects],
  );
  const { data, isLoading, error } = useApiStats(
    state.selectedProjectIds.length > 0 ? state.selectedProjectIds : undefined,
    state.dateRange.from,
    state.dateRange.to,
    state.logQuery,
  );

  const apiKeyNameById = useMemo(() => {
    const keys = apiKeys ?? [];
    return Object.fromEntries(
      keys.map((key) => [key.id, key.name?.trim() || key.prefix]),
    );
  }, [apiKeys]);

  const actorOptions = useMemo<Array<{ value: ActorFilter; label: string }>>(() => {
    const options = [
      { value: "ui" as ActorFilter, label: t("filters.ui") },
      ...(apiKeys ?? []).map((key) => ({
        value: `apiKey:${key.id}` as ActorFilter,
        label: key.name?.trim() || key.prefix,
      })),
    ];

    const hasUnknownApiKeyLog = (data?.logs ?? []).some((log) => {
      const actor = resolveMonitoringLogActor(log, { apiKeyNameById });
      return actor.filterValue === "apiKey:unknown";
    });

    if (
      hasUnknownApiKeyLog ||
      state.selectedActors.includes("apiKey:unknown")
    ) {
      options.push({
        value: "apiKey:unknown" as ActorFilter,
        label: t("filters.unknownApiKey"),
      });
    }

    return options;
  }, [apiKeys, data?.logs, apiKeyNameById, state.selectedActors, t]);

  const availableMethods = useMemo(() => {
    if (!data?.byEndpoint) return new Set<string>();
    return new Set(data.byEndpoint.map((item) => item.method));
  }, [data?.byEndpoint]);

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

  const totalLogs = data?.logsPage?.total ?? data?.logs.length ?? 0;
  const totalPages = data?.logsPage?.totalPages ?? 1;

  useEffect(() => {
    if (state.currentPage > totalPages) {
      state.setCurrentPage(totalPages);
    }
  }, [state.currentPage, state.setCurrentPage, totalPages]);

  useEffect(() => {
    if (state.selectedProjectIds.length === 0) return;

    const validValues = new Set(projectOptions.map((option) => option.value));
    const next = state.selectedProjectIds.filter((value) => validValues.has(value));

    if (next.length !== state.selectedProjectIds.length) {
      state.setSelectedProjectIds(next);
    }
  }, [projectOptions, state.selectedProjectIds, state.setSelectedProjectIds]);

  useEffect(() => {
    if (state.selectedActors.length === 0) return;

    const validValues = new Set(actorOptions.map((option) => option.value));
    const next = state.selectedActors.filter((value) => validValues.has(value));

    if (next.length !== state.selectedActors.length) {
      state.setSelectedActors(next);
    }
  }, [actorOptions, state.selectedActors, state.setSelectedActors]);

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
        dateRange={state.dateRange}
        selectedQuickRange={state.selectedQuickRange}
        calendarOpen={state.calendarOpen}
        onCalendarOpenChange={state.setCalendarOpen}
        onQuickRange={state.handleQuickRange}
        tempRange={state.tempRange}
        onTempRangeChange={state.handleCustomRange}
      />
      <MonitoringFiltersBar
        projectOptions={projectOptions}
        selectedProjectIds={state.selectedProjectIds}
        onProjectChange={state.setSelectedProjectIds}
        selectedActors={state.selectedActors}
        onActorChange={state.setSelectedActors}
        actorOptions={actorOptions}
        statusFilter={state.statusFilter}
        onStatusChange={state.setStatusFilter}
        methodFilter={state.methodFilter}
        onMethodChange={state.setMethodFilter}
        availableMethods={availableMethods}
      />
      <MonitoringKpiGrid summary={data.summary} />
      <MonitoringRequestChart data={chartData} />
      <MonitoringLogsTable
        logs={data.logs}
        totalLogs={totalLogs}
        searchQuery={state.searchQuery}
        onSearchChange={state.setSearchQuery}
        apiKeyNameById={apiKeyNameById}
        advancedFilters={state.advancedFilters}
        onAdvancedFiltersChange={state.setAdvancedFilters}
        rowsPerPage={state.rowsPerPage}
        onRowsPerPageChange={state.setRowsPerPage}
        currentPage={state.currentPage}
        totalPages={totalPages}
        onPageChange={state.setCurrentPage}
        onRowClick={(log) => setSelectedLog(toMonitoringLogDetail(log))}
      />
      {selectedLog ? (
        <MonitoringLogDrawer
          log={selectedLog}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSelectedLog(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
