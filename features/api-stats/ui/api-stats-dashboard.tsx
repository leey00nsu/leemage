"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useApiStats } from "../model/use-api-stats";
import { useGetProjects } from "@/features/projects/list/model/get";
import { LogEntry } from "../model/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Activity,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface ApiLogsDashboardProps {
  projectId?: string;
}

const chartConfig = {
  success: {
    label: "Success",
    color: "hsl(142, 76%, 36%)",
  },
  error: {
    label: "Error",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig;

// 월 목록 생성 (최근 12개월)
function getAvailableMonths(): {
  year: number;
  month: number;
  label: string;
}[] {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: date.getFullYear(),
      month: date.getMonth(),
      label: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      }),
    });
  }
  return months;
}

// 연도별 월 그리드 생성
function getMonthGrid(year: number) {
  const months = [];
  for (let i = 0; i < 12; i++) {
    months.push({
      month: i,
      label: new Date(year, i).toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return months;
}

export function ApiLogsDashboard({
  projectId: initialProjectId,
}: ApiLogsDashboardProps) {
  const t = useTranslations("ApiLogs");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // 프로젝트 필터
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >(initialProjectId);
  const { data: projects } = useGetProjects();

  // 현재 선택된 월
  const [selectedYear, setSelectedYear] = useState(() =>
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().getMonth()
  );
  const [calendarYear, setCalendarYear] = useState(() =>
    new Date().getFullYear()
  );

  // 월의 시작/끝 날짜 계산
  const { startDate, endDate } = useMemo(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
    return { startDate: start, endDate: end };
  }, [selectedYear, selectedMonth]);

  const { data, isLoading, error } = useApiStats(
    selectedProjectId,
    startDate,
    endDate
  );

  // 월 이동
  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth =
      selectedYear === now.getFullYear() && selectedMonth === now.getMonth();
    if (isCurrentMonth) return;

    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const selectMonth = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setCalendarOpen(false);
  };

  // 현재 월 표시 라벨
  const currentMonthLabel = new Date(
    selectedYear,
    selectedMonth
  ).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const isCurrentMonth =
    selectedYear === new Date().getFullYear() &&
    selectedMonth === new Date().getMonth();
  const monthGrid = getMonthGrid(calendarYear);

  if (isLoading) {
    return <ApiLogsSkeleton />;
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          {t("error")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 필터 영역: 프로젝트 + 월 선택 (차트 바깥) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 프로젝트 필터 */}
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <Select
            value={selectedProjectId || "all"}
            onValueChange={(value) =>
              setSelectedProjectId(value === "all" ? undefined : value)
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

        {/* 월 선택기 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToPrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="min-w-40 justify-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {currentMonthLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              {/* 연도 선택 */}
              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCalendarYear(calendarYear - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">{calendarYear}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCalendarYear(calendarYear + 1)}
                  disabled={calendarYear >= new Date().getFullYear()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* 월 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                {monthGrid.map((m) => {
                  const now = new Date();
                  const isFuture =
                    calendarYear > now.getFullYear() ||
                    (calendarYear === now.getFullYear() &&
                      m.month > now.getMonth());
                  const isSelected =
                    calendarYear === selectedYear && m.month === selectedMonth;

                  return (
                    <Button
                      key={m.month}
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className="text-sm"
                      disabled={isFuture}
                      onClick={() => selectMonth(calendarYear, m.month)}
                    >
                      {m.label}
                    </Button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 상단 스택 바 차트 */}
      <Card>
        <CardContent className="pt-4 pb-2">
          <div className="h-24">
            {data.byTime.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart data={data.byTime}>
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
      </Card>

      {/* 탭 */}
      <Tabs defaultValue="api-calls" className="w-full">
        <TabsList>
          <TabsTrigger value="api-calls">{t("tabApiCalls")}</TabsTrigger>
          <TabsTrigger value="metrics">{t("tabMetrics")}</TabsTrigger>
        </TabsList>

        {/* API Calls 탭 */}
        <TabsContent value="api-calls" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {data.logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  {t("noData")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">
                          {t("tableEndpoint")}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t("tableTime")}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t("tableDuration")}
                        </th>
                        <th className="text-left p-3 font-medium">
                          {t("tableStatus")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.logs.map((log) => (
                        <LogRow key={log.id} log={log} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics 탭 */}
        <TabsContent value="metrics" className="mt-4 space-y-6">
          {/* 요약 통계 카드 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("totalCalls")}
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  {t("successRate")}
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.successRate.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t("avgResponseTime")}
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.summary.avgResponseTime}ms
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 일별 호출 차트 */}
          {data.byTime.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("callsOverTime")}</CardTitle>
                <CardDescription>
                  {t("callsOverTimeDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={chartConfig}
                  className="h-[200px] w-full"
                >
                  <BarChart data={data.byTime} accessibilityLayer>
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} />
                    <ChartTooltip content={<ChartTooltipContent />} />
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
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* 엔드포인트별 통계 */}
          {data.byEndpoint.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("byEndpoint")}</CardTitle>
                <CardDescription>{t("byEndpointDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.byEndpoint.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <MethodBadge method={item.method} />
                        <span className="font-mono text-sm">
                          {item.endpoint}
                        </span>
                      </div>
                      <span className="font-medium">
                        {item.count.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogRow({ log }: { log: LogEntry }) {
  const formattedTime = new Date(log.createdAt).toLocaleString();

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <MethodBadge method={log.method} />
          <span className="font-mono text-sm">{log.endpoint}</span>
        </div>
      </td>
      <td className="p-3 text-muted-foreground">{formattedTime}</td>
      <td className="p-3 text-muted-foreground">
        {log.durationMs ? `${log.durationMs}ms` : "-"}
      </td>
      <td className="p-3">
        <StatusBadge statusCode={log.statusCode} />
      </td>
    </tr>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    POST: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    DELETE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
    PUT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
    PATCH:
      "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  };

  return (
    <span
      className={`px-2 py-0.5 text-xs rounded font-mono ${
        colors[method] ||
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      }`}
    >
      {method}
    </span>
  );
}

function StatusBadge({ statusCode }: { statusCode: number }) {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;

  let colorClass =
    "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
  let dotColor = "bg-green-500";

  if (isClientError) {
    colorClass =
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
    dotColor = "bg-yellow-500";
  } else if (isServerError) {
    colorClass = "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300";
    dotColor = "bg-red-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded ${colorClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      {statusCode}
    </span>
  );
}

function ApiLogsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <Card>
        <CardContent className="pt-4 pb-2">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <Skeleton className="h-10 w-48" />
      <Card>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
