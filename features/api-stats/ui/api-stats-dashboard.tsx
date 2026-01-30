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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
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
  Calendar as CalendarIcon,
  FolderOpen,
  AlertTriangle,
  Search,
} from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/shared/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Area,
  Line,
  ComposedChart,
} from "recharts";
import { Calendar } from "@/shared/ui/calendar";
import type { DateRange } from "react-day-picker";
import { formatBytes } from "@/shared/lib/format-bytes";

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
  errorRate: {
    label: "Error Rate",
    color: "hsl(38, 92%, 50%)",
  },
} satisfies ChartConfig;

// 날짜 범위 생성 유틸
function createDateRange(days: number): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// 날짜 포맷 유틸
function formatDateLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// 엔드포인트를 가독성 있게 변환 (metadata가 있으면 파일명 포함)
function formatEndpoint(
  endpoint: string,
  method: string,
  metadata?: Record<string, unknown> | null,
): string {
  // projectId 추출
  const projectMatch = endpoint.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1].slice(0, 8) : null;
  const fileName = metadata?.fileName as string | undefined;

  // 엔드포인트 패턴 매핑
  if (endpoint.includes("/files/presign")) {
    return fileName
      ? `${projectId}에 ${fileName} 업로드 준비`
      : `${projectId} 파일 업로드 준비`;
  }
  if (endpoint.includes("/files/confirm")) {
    return fileName
      ? `${projectId}에 ${fileName} 업로드 완료`
      : `${projectId} 파일 업로드 완료`;
  }
  if (endpoint.match(/\/files\/[^/]+\/download/)) {
    return fileName
      ? `${projectId}에서 ${fileName} 다운로드`
      : `${projectId} 파일 다운로드`;
  }
  if (endpoint.match(/\/files\/[^/]+$/)) {
    if (method === "DELETE") {
      return fileName
        ? `${projectId}에서 ${fileName} 삭제`
        : `${projectId} 파일 삭제`;
    }
    return fileName
      ? `${projectId}에서 ${fileName} 조회`
      : `${projectId} 파일 조회`;
  }
  if (endpoint.match(/\/projects\/[^/]+$/)) {
    if (method === "GET") return `${projectId} 프로젝트 조회`;
    if (method === "PUT" || method === "PATCH")
      return `${projectId} 프로젝트 수정`;
    if (method === "DELETE") return `${projectId} 프로젝트 삭제`;
  }
  if (
    endpoint.match(/\/api\/projects\/?$/) ||
    endpoint.match(/\/api\/v1\/projects\/?$/)
  ) {
    return method === "POST" ? "새 프로젝트 생성" : "프로젝트 목록 조회";
  }
  if (endpoint.includes("/storage/usage")) {
    return "스토리지 사용량 조회";
  }
  if (endpoint.includes("/storage/quota")) {
    return "스토리지 할당량 조회";
  }
  if (endpoint.includes("/stats")) {
    return "API 통계 조회";
  }

  // 기본: 축약된 경로 표시
  return (
    endpoint.replace(/\/api\/(v1\/)?/, "").slice(0, 30) +
    (endpoint.length > 30 ? "..." : "")
  );
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

  // 날짜 범위 상태
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() =>
    createDateRange(7),
  );
  const [selectedQuickRange, setSelectedQuickRange] = useState<number | null>(
    7,
  );
  const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);

  // 상태 필터: all | success | error
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">(
    "all",
  );

  // HTTP Method 필터
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // 엔드포인트 검색
  const [searchQuery, setSearchQuery] = useState<string>("");

  // 퀵 범위 선택
  const handleQuickRange = (days: number) => {
    const range = createDateRange(days);
    setDateRange(range);
    setSelectedQuickRange(days);
    setTempRange(undefined);
  };

  // 커스텀 범위 선택
  const handleCustomRange = (range: DateRange | undefined) => {
    setTempRange(range);
    if (range?.from && range?.to) {
      const from = new Date(range.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(range.to);
      to.setHours(23, 59, 59, 999);
      setDateRange({ from, to });
      setSelectedQuickRange(null);
      setCalendarOpen(false);
    }
  };

  // 날짜 범위 라벨
  const dateRangeLabel = `${formatDateLabel(dateRange.from)} - ${formatDateLabel(dateRange.to)}`;

  const { data, isLoading, error } = useApiStats(
    selectedProjectId,
    dateRange.from,
    dateRange.to,
  );

  // 필터링된 로그
  const filteredLogs = useMemo(() => {
    if (!data?.logs) return [];
    return data.logs.filter((log) => {
      // 상태 필터 (성공: 2xx, 실패: 4xx/5xx)
      if (
        statusFilter === "success" &&
        (log.statusCode < 200 || log.statusCode >= 400)
      ) {
        return false;
      }
      if (
        statusFilter === "error" &&
        log.statusCode >= 200 &&
        log.statusCode < 400
      ) {
        return false;
      }
      // HTTP Method 필터
      if (methodFilter !== "all" && log.method !== methodFilter) {
        return false;
      }
      // 엔드포인트 검색
      if (
        searchQuery &&
        !log.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [data?.logs, statusFilter, methodFilter, searchQuery]);

  // HTTP Methods (고정 목록 + 사용 가능 여부)
  const allMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;
  const availableMethods = useMemo(() => {
    if (!data?.logs) return new Set<string>();
    return new Set(data.logs.map((log) => log.method));
  }, [data?.logs]);

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

        {/* 날짜 범위 선택기 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 퀵 범위 버튼 */}
          <div className="flex items-center gap-1">
            {[7, 30, 90].map((days) => (
              <Button
                key={days}
                variant={selectedQuickRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickRange(days)}
              >
                {days}D
              </Button>
            ))}
          </div>

          {/* 커스텀 범위 선택 */}
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                defaultMonth={dateRange.from}
                selected={
                  tempRange ?? { from: dateRange.from, to: dateRange.to }
                }
                onSelect={handleCustomRange}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 필터 버튼 */}
      <div className="flex flex-wrap items-center gap-4">
        {/* 상태 필터 */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">
            {t("filterStatus")}:
          </span>
          {(["all", "success", "error"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === "all"
                ? t("filterAll")
                : status === "success"
                  ? t("filterSuccess")
                  : t("filterError")}
            </Button>
          ))}
        </div>

        {/* HTTP Method 필터 */}
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground mr-1">
            {t("filterMethod")}:
          </span>
          <Button
            variant={methodFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setMethodFilter("all")}
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
                onClick={() => setMethodFilter(method)}
                className={!isAvailable ? "opacity-50" : ""}
              >
                {method}
                {!isAvailable && <span className="ml-1 text-xs">(0)</span>}
              </Button>
            );
          })}
        </div>

        {/* 엔드포인트 검색 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="pl-8 w-48"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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
              {filteredLogs.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">
                  {t("noData")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-3 font-medium">
                          {t("tableDescription")}
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
                      {filteredLogs.map((log) => (
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
          <div className="grid gap-4 md:grid-cols-4">
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
                <CardTitle className="text-sm font-medium">
                  {t("errorRate")}
                </CardTitle>
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
                  <ComposedChart
                    data={data.byTime.map((item) => ({
                      ...item,
                      total: item.success + item.error,
                      errorRate:
                        item.success + item.error > 0
                          ? (item.error / (item.success + item.error)) * 100
                          : 0,
                    }))}
                    accessibilityLayer
                  >
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
                    <YAxis
                      yAxisId="left"
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                    />
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
  const [open, setOpen] = useState(false);
  const formattedTime = new Date(log.createdAt).toLocaleString();
  const displayEndpoint = formatEndpoint(
    log.endpoint,
    log.method,
    log.metadata,
  );

  return (
    <>
      <tr
        className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <td className="p-3">
          <div className="flex items-center gap-2">
            <MethodBadge method={log.method} />
            <span className="text-sm">{displayEndpoint}</span>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MethodBadge method={log.method} />
              <span>{displayEndpoint}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status</span>
                <div className="mt-1">
                  <StatusBadge statusCode={log.statusCode} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Duration</span>
                <div className="mt-1 font-medium">
                  {log.durationMs ? `${log.durationMs}ms` : "-"}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Time</span>
                <div className="mt-1">{formattedTime}</div>
              </div>
              <div>
                <span className="text-muted-foreground">ID</span>
                <div className="mt-1 font-mono text-xs break-all">{log.id}</div>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Full Endpoint</span>
              <div className="mt-1 font-mono text-xs break-all bg-muted p-2 rounded">
                {log.endpoint}
              </div>
            </div>
            {(() => {
              const meta = log.metadata as
                | Record<string, unknown>
                | null
                | undefined;
              const fileName = meta?.fileName as string | undefined;
              const fileSize = meta?.fileSize as number | undefined;
              const thumbnailUrl = meta?.thumbnailUrl as string | undefined;
              if (!meta || Object.keys(meta).length === 0) return null;
              return (
                <div className="text-sm">
                  <span className="text-muted-foreground">추가 정보</span>
                  <div className="mt-1 bg-muted p-2 rounded space-y-2">
                    {thumbnailUrl && (
                      <div className="flex justify-center">
                        <img
                          src={thumbnailUrl}
                          alt={fileName || "미리보기"}
                          className="max-h-32 rounded object-contain"
                        />
                      </div>
                    )}
                    {fileName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">파일명:</span>
                        <span className="font-medium">{fileName}</span>
                      </div>
                    )}
                    {fileSize !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">크기:</span>
                        <span className="font-medium">
                          {formatBytes(fileSize)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
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
