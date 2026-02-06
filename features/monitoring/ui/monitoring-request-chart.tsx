"use client";

import { useTranslations } from "next-intl";
import { Area, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/ui/chart";
import { AppCard } from "@/shared/ui/app/app-card";

interface ChartPoint {
  label: string;
  total: number;
  error: number;
  errorRate: number;
}

export function MonitoringRequestChart({ data }: { data: ChartPoint[] }) {
  const t = useTranslations("Monitoring");

  return (
    <AppCard className="p-6 border border-gray-200 dark:border-gray-800 rounded-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {t("charts.requestVolume")}
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            {t("charts.legendTotal")}
          </span>
          <span className="flex items-center gap-1.5 ml-3">
            <span className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            {t("charts.legendErrors")}
          </span>
        </div>
      </div>
      <div className="h-[260px]">
        {data.length > 0 ? (
          <ChartContainer className="h-full w-full" config={{}}>
            <ComposedChart data={data}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="total"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--primary))"
                fillOpacity={0.15}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="error"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="errorRate"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            {t("charts.noData")}
          </div>
        )}
      </div>
    </AppCard>
  );
}

