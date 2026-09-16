import { describe, expect, it } from "vitest";
import { buildDatabaseUrl } from "@/lib/database-url";

describe("buildDatabaseUrl", () => {
  it("adds bounded production defaults", () => {
    const result = new URL(
      buildDatabaseUrl("postgresql://user:pass@db:5432/app", {})!,
    );

    expect(result.searchParams.get("connection_limit")).toBe("5");
    expect(result.searchParams.get("pool_timeout")).toBe("10");
    expect(result.searchParams.get("connect_timeout")).toBe("5");
    expect(result.searchParams.get("socket_timeout")).toBe("30");
  });

  it("uses environment limits but caps unsafe values", () => {
    const result = new URL(
      buildDatabaseUrl("postgresql://user:pass@db/app", {
        DB_CONNECTION_LIMIT: "500",
        DB_POOL_TIMEOUT_SECONDS: "20",
      })!,
    );

    expect(result.searchParams.get("connection_limit")).toBe("50");
    expect(result.searchParams.get("pool_timeout")).toBe("20");
  });

  it("preserves explicitly configured URL parameters", () => {
    const result = new URL(
      buildDatabaseUrl(
        "postgresql://user:pass@db/app?connection_limit=9&pool_timeout=3",
        { DB_CONNECTION_LIMIT: "2" },
      )!,
    );

    expect(result.searchParams.get("connection_limit")).toBe("9");
    expect(result.searchParams.get("pool_timeout")).toBe("3");
  });
});
