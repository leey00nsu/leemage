"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import {
  createDateRange,
  formatDateLabel,
  type DashboardDateRange,
} from "../lib/date-range";

export type ApiLogStatusFilter = "all" | "success" | "error";

interface UseApiLogFiltersOptions {
  initialProjectId?: string;
}

const ALL_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

export function useApiLogFilters(options: UseApiLogFiltersOptions = {}) {
  const { initialProjectId } = options;

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(
    initialProjectId,
  );
  const [dateRange, setDateRange] = useState<DashboardDateRange>(() =>
    createDateRange(7),
  );
  const [selectedQuickRange, setSelectedQuickRange] = useState<number | null>(7);
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<ApiLogStatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleQuickRange = (days: number) => {
    const range = createDateRange(days);
    setDateRange(range);
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

  const dateRangeLabel = `${formatDateLabel(dateRange.from)} - ${formatDateLabel(
    dateRange.to,
  )}`;

  return {
    calendarOpen,
    setCalendarOpen,
    selectedProjectId,
    setSelectedProjectId,
    dateRange,
    dateRangeLabel,
    selectedQuickRange,
    tempRange,
    statusFilter,
    setStatusFilter,
    methodFilter,
    setMethodFilter,
    searchQuery,
    setSearchQuery,
    handleQuickRange,
    handleCustomRange,
    allMethods: ALL_METHODS,
  };
}
