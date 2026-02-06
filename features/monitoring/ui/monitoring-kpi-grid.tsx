"use client";

import { useTranslations } from "next-intl";
import { Activity, CheckCircle2, Clock3 } from "lucide-react";

import type { ApiStatsSummary } from "@/features/api-stats/model/types";
import { AppKpiCard } from "@/shared/ui/app/app-kpi-card";

interface MonitoringKpiGridProps {
  summary: ApiStatsSummary;
}

export function MonitoringKpiGrid({ summary }: MonitoringKpiGridProps) {
  const t = useTranslations("Monitoring");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AppKpiCard
        label={t("kpi.totalRequests")}
        value={summary.totalCalls.toLocaleString()}
        icon={<Activity className="h-4 w-4" />}
      />
      <AppKpiCard
        label={t("kpi.successRate")}
        value={`${summary.successRate.toFixed(2)}%`}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <AppKpiCard
        label={t("kpi.avgLatency")}
        value={`${summary.avgResponseTime}ms`}
        icon={<Clock3 className="h-4 w-4" />}
      />
    </div>
  );
}

