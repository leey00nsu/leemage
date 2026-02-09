"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import type { ApiLogStatusFilter } from "@/features/api-stats/model/types";
import { createDateRange } from "@/features/monitoring/lib/monitoring-utils";
import {
  DEFAULT_ADVANCED_LOG_FILTERS,
  type ActorFilter,
  type AdvancedLogFilters,
  type MethodFilter,
} from "@/features/monitoring/model/filters";

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100] as const;
const ROWS_PER_PAGE_STORAGE_KEY = "monitoring.logs.rowsPerPage";

export interface MonitoringDashboardState {
  calendarOpen: boolean;
  selectedProjectIds: string[];
  dateRange: { from: Date; to: Date };
  selectedQuickRange: number | null;
  tempRange: DateRange | undefined;
  statusFilter: ApiLogStatusFilter;
  selectedMethods: MethodFilter[];
  selectedActors: ActorFilter[];
  searchQuery: string;
  advancedFilters: AdvancedLogFilters;
  rowsPerPage: number;
  currentPage: number;
  setCalendarOpen: (next: boolean) => void;
  setSelectedProjectIds: (next: string[]) => void;
  setStatusFilter: (next: ApiLogStatusFilter) => void;
  setSelectedMethods: (next: MethodFilter[]) => void;
  setSelectedActors: (next: ActorFilter[]) => void;
  setSearchQuery: (next: string) => void;
  setAdvancedFilters: (next: AdvancedLogFilters) => void;
  setRowsPerPage: (next: number) => void;
  setCurrentPage: (next: number) => void;
  handleQuickRange: (days: number) => void;
  handleCustomRange: (range: DateRange | undefined) => void;
  logQuery: {
    page: number;
    pageSize: number;
    status: ApiLogStatusFilter;
    methods?: MethodFilter[];
    actors?: ActorFilter[];
    search?: string;
    statusCodeClasses: AdvancedLogFilters["statusCodeClasses"];
    latencyMinMs?: number;
    latencyMaxMs?: number;
    metadataKeyword?: string;
  };
}

export function useMonitoringDashboardState(): MonitoringDashboardState {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState(() => createDateRange(7));
  const [selectedQuickRange, setSelectedQuickRange] = useState<number | null>(7);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ApiLogStatusFilter>("all");
  const [selectedMethods, setSelectedMethods] = useState<MethodFilter[]>([]);
  const [selectedActors, setSelectedActors] = useState<ActorFilter[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedLogFilters>(
    DEFAULT_ADVANCED_LOG_FILTERS,
  );
  const [rowsPerPage, setRowsPerPage] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const raw = localStorage.getItem(ROWS_PER_PAGE_STORAGE_KEY);
    if (!raw) return;

    const parsed = Number(raw);
    if (ROWS_PER_PAGE_OPTIONS.includes(parsed as (typeof ROWS_PER_PAGE_OPTIONS)[number])) {
      setRowsPerPage(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ROWS_PER_PAGE_STORAGE_KEY, String(rowsPerPage));
  }, [rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedProjectIds,
    dateRange.from?.toISOString(),
    dateRange.to?.toISOString(),
    statusFilter,
    selectedMethods,
    selectedActors,
    searchQuery,
    advancedFilters,
    rowsPerPage,
  ]);

  const logQuery = useMemo(
    () => ({
      page: currentPage,
      pageSize: rowsPerPage,
      status: statusFilter,
      methods: selectedMethods.length > 0 ? selectedMethods : undefined,
      actors: selectedActors.length > 0 ? selectedActors : undefined,
      search: searchQuery.trim() || undefined,
      statusCodeClasses: advancedFilters.statusCodeClasses,
      latencyMinMs: advancedFilters.latencyMinMs,
      latencyMaxMs: advancedFilters.latencyMaxMs,
      metadataKeyword: advancedFilters.metadataKeyword.trim() || undefined,
    }),
    [
      currentPage,
      rowsPerPage,
      statusFilter,
      selectedMethods,
      selectedActors,
      searchQuery,
      advancedFilters,
    ],
  );

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

  return {
    calendarOpen,
    selectedProjectIds,
    dateRange,
    selectedQuickRange,
    tempRange,
    statusFilter,
    selectedMethods,
    selectedActors,
    searchQuery,
    advancedFilters,
    rowsPerPage,
    currentPage,
    setCalendarOpen,
    setSelectedProjectIds,
    setStatusFilter,
    setSelectedMethods,
    setSelectedActors,
    setSearchQuery,
    setAdvancedFilters,
    setRowsPerPage,
    setCurrentPage,
    handleQuickRange,
    handleCustomRange,
    logQuery,
  };
}
