import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { parseStatsQueryParams } from "@/features/api-stats/server/query-params";

describe("stats query bounds", () => {
  it("limits expensive offsets and date ranges", () => {
    const request = new NextRequest(
      "http://localhost/api/stats?logPage=999999&startDate=2000-01-01&endDate=2026-01-01",
    );
    const result = parseStatsQueryParams(request);

    expect(result.logPage).toBe(1_000);
    expect(result.endDate.getTime() - result.startDate.getTime()).toBe(
      366 * 24 * 60 * 60 * 1000,
    );
  });

  it("falls back to a valid range for malformed dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-16T00:00:00Z"));
    const result = parseStatsQueryParams(
      new NextRequest(
        "http://localhost/api/stats?startDate=nope&endDate=also-nope",
      ),
    );
    vi.useRealTimers();

    expect(Number.isFinite(result.startDate.getTime())).toBe(true);
    expect(Number.isFinite(result.endDate.getTime())).toBe(true);
    expect(result.startDate.getFullYear()).toBe(2026);
  });
});
