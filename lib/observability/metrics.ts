const LATENCY_BUCKETS_MS = [10, 50, 100, 250, 500, 1_000, 2_500, 5_000];
const MAX_SERIES = 500;

interface HttpMetric {
  count: number;
  errors: number;
  durationMs: number;
  buckets: number[];
}

interface DependencyMetric {
  count: number;
  errors: number;
  durationMs: number;
}

const httpMetrics = new Map<string, HttpMetric>();
const dependencyMetrics = new Map<string, DependencyMetric>();
let droppedApiLogs = 0;

function boundedKey(map: Map<string, unknown>, key: string) {
  return map.has(key) || map.size < MAX_SERIES ? key : "overflow";
}

export function observeHttpRequest(input: {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
}) {
  const statusClass = `${Math.floor(input.statusCode / 100)}xx`;
  const rawKey = JSON.stringify([input.method, input.route, statusClass]);
  const key = boundedKey(httpMetrics, rawKey);
  const metric = httpMetrics.get(key) ?? {
    count: 0,
    errors: 0,
    durationMs: 0,
    buckets: LATENCY_BUCKETS_MS.map(() => 0),
  };
  metric.count += 1;
  metric.errors += input.statusCode >= 500 ? 1 : 0;
  metric.durationMs += input.durationMs;
  LATENCY_BUCKETS_MS.forEach((bucket, index) => {
    if (input.durationMs <= bucket) metric.buckets[index] += 1;
  });
  httpMetrics.set(key, metric);
}

export function observeDependency(input: {
  dependency: "database" | "storage";
  operation: string;
  durationMs: number;
  success: boolean;
}) {
  const rawKey = JSON.stringify([input.dependency, input.operation]);
  const key = boundedKey(dependencyMetrics, rawKey);
  const metric = dependencyMetrics.get(key) ?? {
    count: 0,
    errors: 0,
    durationMs: 0,
  };
  metric.count += 1;
  metric.errors += input.success ? 0 : 1;
  metric.durationMs += input.durationMs;
  dependencyMetrics.set(key, metric);
}

export function recordDroppedApiLogs(count: number) {
  droppedApiLogs += count;
}

function escapeLabel(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}

function labels(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}="${escapeLabel(value)}"`)
    .join(",");
}

export function renderMetrics() {
  const lines = [
    "# HELP leemage_http_requests_total Completed authenticated API requests.",
    "# TYPE leemage_http_requests_total counter",
  ];

  for (const [key, metric] of httpMetrics) {
    const [method, route, statusClass] =
      key === "overflow" ? ["OTHER", "overflow", "other"] : JSON.parse(key);
    const common = { method, route, status_class: statusClass };
    lines.push(
      `leemage_http_requests_total{${labels(common)}} ${metric.count}`,
      `leemage_http_request_errors_total{${labels(common)}} ${metric.errors}`,
      `leemage_http_request_duration_ms_sum{${labels(common)}} ${metric.durationMs}`,
      `leemage_http_request_duration_ms_count{${labels(common)}} ${metric.count}`,
    );
    metric.buckets.forEach((count, index) => {
      lines.push(
        `leemage_http_request_duration_ms_bucket{${labels({ ...common, le: String(LATENCY_BUCKETS_MS[index]) })}} ${count}`,
      );
    });
    lines.push(
      `leemage_http_request_duration_ms_bucket{${labels({ ...common, le: "+Inf" })}} ${metric.count}`,
    );
  }

  lines.push(
    "# HELP leemage_dependency_requests_total Database and storage operations.",
    "# TYPE leemage_dependency_requests_total counter",
  );
  for (const [key, metric] of dependencyMetrics) {
    const [dependency, operation] =
      key === "overflow" ? ["other", "overflow"] : JSON.parse(key);
    const common = { dependency, operation };
    lines.push(
      `leemage_dependency_requests_total{${labels(common)}} ${metric.count}`,
      `leemage_dependency_errors_total{${labels(common)}} ${metric.errors}`,
      `leemage_dependency_duration_ms_sum{${labels(common)}} ${metric.durationMs}`,
      `leemage_dependency_duration_ms_count{${labels(common)}} ${metric.count}`,
    );
  }
  lines.push(
    "# HELP leemage_api_logs_dropped_total API audit logs dropped after persistence failure or backpressure.",
    "# TYPE leemage_api_logs_dropped_total counter",
    `leemage_api_logs_dropped_total ${droppedApiLogs}`,
  );
  return `${lines.join("\n")}\n`;
}

export function resetMetricsForTests() {
  httpMetrics.clear();
  dependencyMetrics.clear();
  droppedApiLogs = 0;
}
