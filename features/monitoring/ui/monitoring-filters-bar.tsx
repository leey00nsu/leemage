"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import { AppButton } from "@/shared/ui/app/app-button";
import { AppCard } from "@/shared/ui/app/app-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  ALL_METHODS,
  ActorFilter,
  MethodFilter,
  StatusFilter,
} from "@/features/monitoring/model/filters";

interface FilterOption {
  value: string;
  label: string;
}

interface MonitoringFiltersBarProps {
  projectOptions: FilterOption[];
  selectedProjectIds: string[];
  onProjectChange: (value: string[]) => void;
  selectedActors: ActorFilter[];
  onActorChange: (value: ActorFilter[]) => void;
  actorOptions: { value: ActorFilter; label: string }[];
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  selectedMethods: MethodFilter[];
  onMethodChange: (value: MethodFilter[]) => void;
  methodCounts: Partial<Record<MethodFilter, number>>;
}

export function MonitoringFiltersBar({
  projectOptions,
  selectedProjectIds,
  onProjectChange,
  selectedActors,
  onActorChange,
  actorOptions,
  statusFilter,
  onStatusChange,
  selectedMethods,
  onMethodChange,
  methodCounts,
}: MonitoringFiltersBarProps) {
  const t = useTranslations("Monitoring");
  const selectedMethodSet = useMemo(
    () => new Set(selectedMethods),
    [selectedMethods],
  );
  const isAllMethodsSelected = selectedMethods.length === 0;

  const toggleMethod = (method: MethodFilter) => {
    if (isAllMethodsSelected) {
      onMethodChange(ALL_METHODS.filter((item) => item !== method));
      return;
    }

    const next = new Set(selectedMethods);
    if (next.has(method)) {
      next.delete(method);
    } else {
      next.add(method);
    }

    if (next.size === 0) {
      return;
    }

    if (next.size === ALL_METHODS.length) {
      onMethodChange([]);
      return;
    }

    onMethodChange(Array.from(next));
  };

  return (
    <AppCard className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex flex-wrap items-center gap-3">
        <MultiCheckFilter
          label={t("filters.project")}
          allLabel={t("filters.allProjects")}
          selectedValues={selectedProjectIds}
          onChange={onProjectChange}
          options={projectOptions}
          ariaLabel={t("filters.project")}
        />
        <MultiCheckFilter
          label={t("filters.actor")}
          allLabel={t("filters.allActors")}
          selectedValues={selectedActors}
          onChange={(values) => onActorChange(values as ActorFilter[])}
          options={actorOptions}
          ariaLabel={t("filters.actor")}
        />
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "success", "error"] as const).map((status) => (
            <AppButton
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => onStatusChange(status)}
            >
              {status === "all"
                ? t("filters.all")
                : status === "success"
                  ? t("filters.success")
                  : t("filters.error")}
            </AppButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AppButton
            variant={isAllMethodsSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onMethodChange([])}
          >
            {t("filters.all")}
          </AppButton>
          {ALL_METHODS.map((method) => {
            const count = methodCounts[method] ?? 0;
            const isActive = isAllMethodsSelected || selectedMethodSet.has(method);
            return (
              <AppButton
                key={method}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMethod(method)}
                className={count === 0 ? "opacity-50" : ""}
              >
                {method}
                <span className="ml-1 text-xs">({count})</span>
              </AppButton>
            );
          })}
        </div>
      </div>
    </AppCard>
  );
}

interface MultiCheckFilterProps {
  label: string;
  allLabel: string;
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: FilterOption[];
  ariaLabel: string;
}

function MultiCheckFilter({
  label,
  allLabel,
  selectedValues,
  onChange,
  options,
  ariaLabel,
}: MultiCheckFilterProps) {
  const t = useTranslations("Monitoring");
  const optionValues = useMemo(
    () => options.map((option) => option.value),
    [options],
  );
  const selectedSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );
  const isAllSelected =
    selectedValues.length === 0 || selectedValues.length === optionValues.length;

  const summary = useMemo(() => {
    if (isAllSelected || options.length === 0) {
      return allLabel;
    }

    if (selectedValues.length === 1) {
      return (
        options.find((option) => option.value === selectedValues[0])?.label || allLabel
      );
    }

    return t("filters.selectedCount", { count: selectedValues.length });
  }, [allLabel, isAllSelected, options, selectedValues, t]);

  const toggleOption = (value: string) => {
    if (optionValues.length === 0) return;

    if (isAllSelected) {
      const next = optionValues.filter((item) => item !== value);
      onChange(next);
      return;
    }

    const nextSet = new Set(selectedValues);
    if (nextSet.has(value)) {
      if (nextSet.size === 1) return;
      nextSet.delete(value);
    } else {
      nextSet.add(value);
    }

    if (nextSet.size === optionValues.length) {
      onChange([]);
      return;
    }

    onChange(Array.from(nextSet));
  };

  return (
    <div className="min-w-[220px]">
      <Popover>
        <PopoverTrigger asChild>
          <AppButton
            variant="outline"
            size="sm"
            className="h-9 w-full justify-between px-3"
            aria-label={ariaLabel}
          >
            <span className="truncate text-left">
              {label}: {summary}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
          </AppButton>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => onChange([])}
              className="h-7 px-2 text-xs"
            >
              {t("filters.selectAll")}
            </AppButton>
          </div>
          <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
            {options.length === 0 ? (
              <p className="px-1 py-2 text-xs text-slate-500">
                {t("filters.noOptions")}
              </p>
            ) : (
              options.map((option) => {
                const checked = isAllSelected || selectedSet.has(option.value);

                return (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleOption(option.value)}
                    />
                    <span className="truncate text-sm">{option.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
