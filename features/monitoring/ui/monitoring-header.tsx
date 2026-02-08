"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { AppPageHeader } from "@/shared/ui/app/app-page-header";
import { AppButton } from "@/shared/ui/app/app-button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Calendar } from "@/shared/ui/calendar";
import { getDateFnsLocale } from "@/shared/lib/date-fns-locale";
import { formatDateLabel } from "@/features/monitoring/lib/monitoring-utils";

interface MonitoringHeaderProps {
  dateRange: { from: Date; to: Date };
  selectedQuickRange: number | null;
  calendarOpen: boolean;
  onCalendarOpenChange: (open: boolean) => void;
  onQuickRange: (days: number) => void;
  tempRange: DateRange | undefined;
  onTempRangeChange: (range: DateRange | undefined) => void;
}

export function MonitoringHeader({
  dateRange,
  selectedQuickRange,
  calendarOpen,
  onCalendarOpenChange,
  onQuickRange,
  tempRange,
  onTempRangeChange,
}: MonitoringHeaderProps) {
  const t = useTranslations("Monitoring");
  const locale = useLocale();
  const calendarLocale = useMemo(() => getDateFnsLocale(locale), [locale]);

  const dateRangeLabel = useMemo(
    () => `${formatDateLabel(dateRange.from, locale)} - ${formatDateLabel(dateRange.to, locale)}`,
    [dateRange.from, dateRange.to, locale]
  );

  return (
    <AppPageHeader
      heading={t("heading")}
      description={t("subheading")}
      actions={
        <>
          <div className="flex items-center gap-1">
            {[1, 7, 30].map((days, index) => (
              <AppButton
                key={days}
                variant={selectedQuickRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => onQuickRange(days)}
              >
                {index === 0 ? t("dateRange.last24h") : `${days}${t("dateRange.days")}`}
              </AppButton>
            ))}
          </div>
          <Popover open={calendarOpen} onOpenChange={onCalendarOpenChange}>
            <PopoverTrigger asChild>
              <AppButton
                variant={selectedQuickRange === null ? "default" : "outline"}
                className="min-w-[220px] justify-start gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                {dateRangeLabel}
              </AppButton>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                locale={calendarLocale}
                defaultMonth={dateRange.from}
                selected={tempRange ?? { from: dateRange.from, to: dateRange.to }}
                onSelect={onTempRangeChange}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </>
      }
    />
  );
}
