"use client";

import { useTranslations } from "next-intl";

import { AppButton } from "@/shared/ui/app/app-button";
import { AppSelect } from "@/shared/ui/app/app-select";
import { AppCard } from "@/shared/ui/app/app-card";
import { ALL_METHODS, MethodFilter, StatusFilter } from "@/features/monitoring/model/filters";

interface ProjectOption {
  id: string;
  name: string;
}

interface MonitoringFiltersBarProps {
  projects?: ProjectOption[];
  selectedProjectId: string;
  onProjectChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  methodFilter: MethodFilter;
  onMethodChange: (value: MethodFilter) => void;
  availableMethods: Set<string>;
}

export function MonitoringFiltersBar({
  projects,
  selectedProjectId,
  onProjectChange,
  statusFilter,
  onStatusChange,
  methodFilter,
  onMethodChange,
  availableMethods,
}: MonitoringFiltersBarProps) {
  const t = useTranslations("Monitoring");

  return (
    <AppCard className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[200px]">
          <AppSelect
            value={selectedProjectId}
            onChange={onProjectChange}
            options={[
              { value: "all", label: t("filters.allProjects") },
              ...(projects?.map((project) => ({
                value: project.id,
                label: project.name,
              })) ?? []),
            ]}
            aria-label={t("filters.project")}
          />
        </div>
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
            variant={methodFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onMethodChange("all")}
          >
            {t("filters.all")}
          </AppButton>
          {ALL_METHODS.map((method) => {
            const isAvailable = availableMethods.has(method);
            return (
              <AppButton
                key={method}
                variant={methodFilter === method ? "default" : "outline"}
                size="sm"
                onClick={() => onMethodChange(method)}
                className={!isAvailable ? "opacity-50" : ""}
              >
                {method}
                {!isAvailable && <span className="ml-1 text-xs">(0)</span>}
              </AppButton>
            );
          })}
        </div>
      </div>
    </AppCard>
  );
}

