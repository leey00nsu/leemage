import { useLocale, useTranslations } from "next-intl";
import { Calendar as CalendarIcon, FolderOpen, Search } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { getDateFnsLocale } from "@/shared/lib/date-fns-locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { ApiLogStatusFilter } from "../model/use-api-log-filters";

interface ProjectOption {
  id: string;
  name: string;
}

interface ApiStatsFiltersProps {
  projects?: ProjectOption[];
  selectedProjectId?: string;
  onProjectIdChange: (projectId?: string) => void;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  selectedQuickRange: number | null;
  dateRangeLabel: string;
  dateRange: { from: Date; to: Date };
  tempRange?: DateRange;
  onQuickRangeSelect: (days: number) => void;
  onCustomRangeSelect: (range: DateRange | undefined) => void;
  statusFilter: ApiLogStatusFilter;
  onStatusFilterChange: (status: ApiLogStatusFilter) => void;
  methodFilter: string;
  onMethodFilterChange: (method: string) => void;
  allMethods: readonly string[];
  availableMethods: Set<string>;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export function ApiStatsFilters({
  projects,
  selectedProjectId,
  onProjectIdChange,
  calendarOpen,
  onCalendarOpenChange,
  selectedQuickRange,
  dateRangeLabel,
  dateRange,
  tempRange,
  onQuickRangeSelect,
  onCustomRangeSelect,
  statusFilter,
  onStatusFilterChange,
  methodFilter,
  onMethodFilterChange,
  allMethods,
  availableMethods,
  searchQuery,
  onSearchQueryChange,
}: ApiStatsFiltersProps) {
  const t = useTranslations("ApiLogs");
  const locale = useLocale();
  const calendarLocale = getDateFnsLocale(locale);

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedProjectId || "all"}
            onValueChange={(value) =>
              onProjectIdChange(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t("allProjects")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allProjects")}</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={selectedQuickRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => onQuickRangeSelect(days)}
              >
                {days}D
              </Button>
            ))}
          </div>

          <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger asChild>
              <Button
                variant={selectedQuickRange === null ? "default" : "outline"}
                className="min-w-56 justify-start gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRangeLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                locale={calendarLocale}
                defaultMonth={dateRange.from}
                selected={tempRange ?? { from: dateRange.from, to: dateRange.to }}
                onSelect={onCustomRangeSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">
            {t("filterStatus")}:
          </span>
          {(["all", "success", "error"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusFilterChange(status)}
            >
              {status === "all"
                ? t("filterAll")
                : status === "success"
                  ? t("filterSuccess")
                  : t("filterError")}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">
            {t("filterMethod")}:
          </span>
          <Button
            variant={methodFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onMethodFilterChange("all")}
          >
            {t("filterAll")}
          </Button>
          {allMethods.map((method) => {
            const isAvailable = availableMethods.has(method);
            return (
              <Button
                key={method}
                variant={methodFilter === method ? "default" : "outline"}
                size="sm"
                onClick={() => onMethodFilterChange(method)}
                className={!isAvailable ? "opacity-50" : ""}
              >
                {method}
                {!isAvailable && <span className="ml-1 text-xs">(0)</span>}
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="pl-8 w-48"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
