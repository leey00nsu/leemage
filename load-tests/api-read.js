import http from "k6/http";
import execution from "k6/execution";
import { check, fail } from "k6";
import { Rate } from "k6/metrics";

const profile = __ENV.PROFILE || "10rps";
const duration = __ENV.DURATION || "30s";
const baseUrl = (__ENV.BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const apiKeys = (__ENV.API_KEYS || __ENV.API_KEY || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const projectId = (__ENV.PROJECT_ID || "").trim();
const latencyTarget = Number(__ENV.LATENCY_P95_MS || 1000);

const profiles = {
  "10rps": {
    executor: "constant-arrival-rate",
    rate: 10,
    timeUnit: "1s",
    duration,
    preAllocatedVUs: 10,
    maxVUs: 50,
  },
  "50rps": {
    executor: "constant-arrival-rate",
    rate: 50,
    timeUnit: "1s",
    duration,
    preAllocatedVUs: 25,
    maxVUs: 150,
  },
  "100rps": {
    executor: "constant-arrival-rate",
    rate: 100,
    timeUnit: "1s",
    duration,
    preAllocatedVUs: 50,
    maxVUs: 300,
  },
  burst500: {
    executor: "shared-iterations",
    vus: 500,
    iterations: 500,
    maxDuration: "30s",
  },
};

if (!profiles[profile]) {
  throw new Error(`Unknown PROFILE '${profile}'. Use 10rps, 50rps, 100rps, or burst500.`);
}

export const options = {
  discardResponseBodies: true,
  scenarios: { [profile]: profiles[profile] },
  thresholds: {
    checks: ["rate>0.99"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: [`p(95)<${latencyTarget}`],
    rate_limited: ["rate==0"],
    server_errors: ["rate<0.01"],
  },
};

const rateLimited = new Rate("rate_limited");
const serverErrors = new Rate("server_errors");

export function setup() {
  if (apiKeys.length === 0) {
    fail("API_KEYS (comma-separated) or API_KEY is required");
  }

  const readiness = http.get(`${baseUrl}/api/health/ready`, {
    tags: { endpoint: "health-ready" },
    timeout: "5s",
  });
  if (readiness.status !== 200) {
    fail(`Target is not ready (status=${readiness.status})`);
  }
}

export default function () {
  const iteration = execution.scenario.iterationInTest;
  const apiKey = apiKeys[iteration % apiKeys.length];
  const useProjectDetails = projectId && iteration % 2 === 1;
  const path = useProjectDetails
    ? `/api/v1/projects/${encodeURIComponent(projectId)}?page=1&pageSize=50`
    : "/api/v1/projects";
  const endpoint = useProjectDetails ? "project-detail" : "project-list";

  const response = http.get(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    tags: { endpoint },
    timeout: "10s",
  });

  rateLimited.add(response.status === 429, { endpoint });
  serverErrors.add(response.status >= 500, { endpoint });
  check(response, {
    "status is 200": (result) => result.status === 200,
    "request id is returned": (result) => Boolean(result.headers["X-Request-Id"]),
  });
}
