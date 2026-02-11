import { AppCard } from "@/shared/ui/app/app-card";
import { useTranslations } from "next-intl";
import { Bar, BarChart, XAxis } from "recharts";

import { CardContent } from "@/shared/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

import { apiStatsChartConfig } from "../lib/chart-config";
import type { TimeStats } from "../model/types";

interface ApiStatsOverviewChartProps {
  byTime: TimeStats[];
}

export function ApiStatsOverviewChart({ byTime }: ApiStatsOverviewChartProps) {
  const t = useTranslations("ApiLogs");

  return (
    <AppCard>
      <CardContent className="pt-4 pb-2">
        <div className="h-24">
          {byTime.length > 0 ? (
            <ChartContainer config={apiStatsChartConfig} className="h-full w-full">
              <BarChart data={byTime}>
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={10}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Bar
                  dataKey="success"
                  stackId="a"
                  fill="hsl(142, 76%, 36%)"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="error"
                  stackId="a"
                  fill="hsl(0, 84%, 60%)"
                  radius={[2, 2, 0, 0]}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("noData")}
            </div>
          )}
        </div>
      </CardContent>
    </AppCard>
  );
}
