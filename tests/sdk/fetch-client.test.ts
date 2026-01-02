import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FetchClient } from "@/packages/sdk/src/utils/fetch";
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
} from "@/packages/sdk/src/errors";

describe("FetchClient", () => {
  const apiKey = "test-key";
  const baseUrl = "https://api.example.com/";
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: FetchClient;

  beforeEach(() => {
    client = new FetchClient({ baseUrl, apiKey, timeout: 1000 });
    fetchMock = vi.fn();
    (globalThis as { fetch?: typeof fetch }).fetch =
      fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    (globalThis as { fetch?: typeof fetch }).fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("builds request url, headers, and body", async () => {
    const response = {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ ok: true }),
    };
    fetchMock.mockResolvedValue(response);

    const result = await client.request<{ ok: boolean }>("/v1/test", {
      method: "POST",
      body: { hello: "world" },
      headers: { "X-Test": "yes" },
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/test",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Test": "yes",
        }),
        body: JSON.stringify({ hello: "world" }),
      })
    );
  });

  it("returns undefined for 204 responses", async () => {
    const response = {
      ok: true,
      status: 204,
      json: vi.fn(),
    };
    fetchMock.mockResolvedValue(response);

    const result = await client.get("/no-content");

    expect(result).toBeUndefined();
    expect(response.json).not.toHaveBeenCalled();
  });

  it("maps error responses to typed errors", async () => {
    const cases = [
      { status: 400, ErrorClass: ValidationError },
      { status: 401, ErrorClass: AuthenticationError },
      { status: 404, ErrorClass: NotFoundError },
    ];

    for (const { status, ErrorClass } of cases) {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
        statusText: "Error",
        json: vi.fn().mockResolvedValue({ message: "error" }),
      });

      await expect(client.get(`/status-${status}`)).rejects.toBeInstanceOf(
        ErrorClass
      );
    }
  });

  it("falls back to statusText when error body is not json", async () => {
    const response = {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: vi.fn().mockRejectedValue(new Error("bad json")),
    };
    fetchMock.mockResolvedValue(response);

    await expect(client.get("/missing")).rejects.toMatchObject({
      message: "Not Found",
    });
  });

  it("wraps abort errors as NetworkError", async () => {
    const abortError = new Error("aborted");
    (abortError as Error & { name: string }).name = "AbortError";
    fetchMock.mockRejectedValue(abortError);

    await expect(client.get("/slow")).rejects.toMatchObject({
      name: "NetworkError",
      status: 0,
    });
  });

  it("wraps generic errors as NetworkError", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));

    await expect(client.get("/boom")).rejects.toMatchObject({
      name: "NetworkError",
      status: 0,
      message: "boom",
    });
  });
});
