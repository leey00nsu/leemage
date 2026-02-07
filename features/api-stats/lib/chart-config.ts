import type { ChartConfig } from "@/shared/ui/chart";

export const apiStatsChartConfig = {
  success: {
    label: "Success",
    color: "hsl(142, 76%, 36%)",
  },
  error: {
    label: "Error",
    color: "hsl(0, 84%, 60%)",
  },
  errorRate: {
    label: "Error Rate",
    color: "hsl(38, 92%, 50%)",
  },
} satisfies ChartConfig;
