import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { TabsContent } from "@/shared/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";

import { apiStatsChartConfig } from "../lib/chart-config";
import type { ApiStatsResponse } from "../model/types";
import { MethodBadge } from "./api-log-badges";

interface ApiStatsMetricsTabProps {
  data: ApiStatsResponse;
}

export function ApiStatsMetricsTab({ data }: ApiStatsMetricsTabProps) {
  const t = useTranslations("ApiLogs");

  const byTimeWithRate = useMemo(
    () =>
      data.byTime.map((item) => ({
        ...item,
        total: item.success + item.error,
        errorRate:
          item.success + item.error > 0
            ? (item.error / (item.success + item.error)) * 100
            : 0,
      })),
    [data.byTime],
  );

  return (
    <TabsContent value="metrics" className="mt-4 space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalCalls")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.totalCalls.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("successRate")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.successRate.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("errorRate")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(100 - data.summary.successRate).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("avgResponseTime")}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgResponseTime}ms</div>
          </CardContent>
        </Card>
      </div>

      {data.byTime.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("callsOverTime")}</CardTitle>
            <CardDescription>{t("callsOverTimeDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={apiStatsChartConfig} className="h-[200px] w-full">
              <ComposedChart data={byTimeWithRate} accessibilityLayer>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="success"
                  stackId="a"
                  fill="hsl(142, 76%, 36%)"
                  stroke="hsl(142, 76%, 36%)"
                  fillOpacity={0.4}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="error"
                  stackId="a"
                  fill="hsl(0, 84%, 60%)"
                  stroke="hsl(0, 84%, 60%)"
                  fillOpacity={0.4}
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
          </CardContent>
        </Card>
      )}

      {data.byEndpoint.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("byEndpoint")}</CardTitle>
            <CardDescription>{t("byEndpointDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.byEndpoint.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MethodBadge method={item.method} />
                    <span className="font-mono text-sm">{item.endpoint}</span>
                  </div>
                  <span className="font-medium">{item.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
