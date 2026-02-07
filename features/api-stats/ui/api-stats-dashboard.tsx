"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { useApiStats } from "../model/use-api-stats";
import { useApiLogFilters } from "../model/use-api-log-filters";
import { useGetProjects } from "@/features/projects/list/model/get";
import type { LogEntry } from "../model/types";
import { Card, CardContent } from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { ApiStatsFilters } from "./api-stats-filters";
import { ApiStatsOverviewChart } from "./api-stats-overview-chart";
import { ApiCallsTable } from "./api-calls-table";
import { ApiLogDetailDialog } from "./api-log-detail-dialog";
import { ApiStatsMetricsTab } from "./api-stats-metrics-tab";
import { ApiLogsSkeleton } from "./api-logs-skeleton";

interface ApiLogsDashboardProps {
  projectId?: string;
}

export function ApiLogsDashboard({ projectId: initialProjectId }: ApiLogsDashboardProps) {
  const t = useTranslations("ApiLogs");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filters = useApiLogFilters({ initialProjectId });
  const { data: projects } = useGetProjects();
  const { data, isLoading, error } = useApiStats(
    filters.selectedProjectId,
    filters.dateRange.from,
    filters.dateRange.to,
  );

  const logs = data?.logs ?? [];
  const availableMethods = useMemo(
    () => new Set(logs.map((log) => log.method)),
    [logs],
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (
          filters.statusFilter === "success" &&
          (log.statusCode < 200 || log.statusCode >= 400)
        ) {
          return false;
        }
        if (
          filters.statusFilter === "error" &&
          log.statusCode >= 200 &&
          log.statusCode < 400
        ) {
          return false;
        }
        if (filters.methodFilter !== "all" && log.method !== filters.methodFilter) {
          return false;
        }
        if (
          filters.searchQuery &&
          !log.endpoint.toLowerCase().includes(filters.searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [logs, filters.statusFilter, filters.methodFilter, filters.searchQuery],
  );

  if (isLoading) {
    return <ApiLogsSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t("error")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <ApiStatsFilters
        projects={projects}
        selectedProjectId={filters.selectedProjectId}
        onProjectIdChange={filters.setSelectedProjectId}
        calendarOpen={filters.calendarOpen}
        onCalendarOpenChange={filters.setCalendarOpen}
        selectedQuickRange={filters.selectedQuickRange}
        dateRangeLabel={filters.dateRangeLabel}
        dateRange={filters.dateRange}
        tempRange={filters.tempRange}
        onQuickRangeSelect={filters.handleQuickRange}
        onCustomRangeSelect={filters.handleCustomRange}
        statusFilter={filters.statusFilter}
        onStatusFilterChange={filters.setStatusFilter}
        methodFilter={filters.methodFilter}
        onMethodFilterChange={filters.setMethodFilter}
        allMethods={filters.allMethods}
        availableMethods={availableMethods}
        searchQuery={filters.searchQuery}
        onSearchQueryChange={filters.setSearchQuery}
      />

      <ApiStatsOverviewChart byTime={data.byTime} />

      <Tabs defaultValue="api-calls" className="w-full">
        <TabsList>
          <TabsTrigger value="api-calls">{t("tabApiCalls")}</TabsTrigger>
          <TabsTrigger value="metrics">{t("tabMetrics")}</TabsTrigger>
        </TabsList>

        <TabsContent value="api-calls" className="mt-4">
          <ApiCallsTable logs={filteredLogs} onRowClick={setSelectedLog} />
          <ApiLogDetailDialog
            log={selectedLog}
            open={Boolean(selectedLog)}
            onOpenChange={(open) => {
              if (!open) {
                setSelectedLog(null);
              }
            }}
          />
        </TabsContent>

        <ApiStatsMetricsTab data={data} />
      </Tabs>
    </div>
  );
}
