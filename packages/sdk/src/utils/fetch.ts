import {
  LeemageError,
  NetworkError,
  PermissionDeniedError,
  RateLimitError,
} from "../errors";
import type { ErrorResponse } from "../types/api";

export interface FetchClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  allowInsecureHttp?: boolean;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * HTTP 클라이언트 래퍼
 */
export class FetchClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor(options: FetchClientOptions) {
    let parsedBaseUrl: URL;
    try {
      parsedBaseUrl = new URL(options.baseUrl);
    } catch {
      throw new Error("baseUrl은 올바른 절대 URL이어야 합니다.");
    }

    const isHttps = parsedBaseUrl.protocol === "https:";
    const isHttp = parsedBaseUrl.protocol === "http:";
    if (!isHttps && !(options.allowInsecureHttp && isHttp)) {
      throw new Error(
        "보안을 위해 baseUrl은 https 프로토콜이어야 합니다. 로컬 개발 환경에서는 allowInsecureHttp 옵션을 사용할 수 있습니다."
      );
    }

    this.baseUrl = parsedBaseUrl.toString().replace(/\/$/, "");
    this.apiKey = options.apiKey;
    this.timeout = options.timeout ?? 30000;

    if (!Number.isFinite(this.timeout) || this.timeout <= 0) {
      throw new Error("timeout은 0보다 큰 숫자여야 합니다.");
    }
  }

  /**
   * API 요청 실행
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const { method = "GET", body, headers = {} } = options;
    const normalizedHeaders = this.createRequestHeaders(body, headers);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: normalizedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        const retryAfter = this.parseRetryAfterSeconds(response);

        if (response.status === 403) {
          throw new PermissionDeniedError(
            errorData.message,
            response.status,
            errorData.errors
          );
        }

        if (response.status === 429) {
          throw new RateLimitError(
            errorData.message,
            response.status,
            errorData.errors,
            retryAfter
          );
        }

        throw LeemageError.fromResponse(errorData, response.status);
      }

      // 204 No Content 처리
      if (response.status === 204) {
        return undefined as T;
      }

      const contentLength = response.headers?.get?.("content-length");
      if (contentLength === "0") {
        return undefined as T;
      }

      if (typeof response.text === "function") {
        const responseText = await response.text();
        if (!responseText) {
          return undefined as T;
        }

        try {
          return JSON.parse(responseText) as T;
        } catch {
          return responseText as T;
        }
      }

      if (typeof response.json === "function") {
        return (await response.json()) as T;
      }

      return undefined as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof LeemageError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new NetworkError("요청 시간이 초과되었습니다.");
        }
        throw new NetworkError(error.message);
      }

      throw new NetworkError("알 수 없는 오류가 발생했습니다.");
    }
  }

  private createRequestHeaders(
    body: unknown,
    headers: Record<string, string>
  ): Record<string, string> {
    const normalizedHeaders: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      ...headers,
    };

    const hasContentTypeHeader = Object.keys(normalizedHeaders).some(
      (key) => key.toLowerCase() === "content-type"
    );

    if (body !== undefined && !hasContentTypeHeader) {
      normalizedHeaders["Content-Type"] = "application/json";
    }

    return normalizedHeaders;
  }

  private async parseErrorResponse(response: Response): Promise<ErrorResponse> {
    const defaultError: ErrorResponse = {
      message: response.statusText || "요청에 실패했습니다.",
    };

    let rawBody = "";
    if (typeof response.text === "function") {
      rawBody = await response.text();
    } else if (typeof response.json === "function") {
      try {
        const parsedJson = (await response.json()) as Partial<ErrorResponse>;
        if (typeof parsedJson.message === "string") {
          return {
            message: parsedJson.message,
            errors: parsedJson.errors,
          };
        }
      } catch {
        return defaultError;
      }
    }

    if (!rawBody) {
      return defaultError;
    }

    try {
      const parsed = JSON.parse(rawBody) as Partial<ErrorResponse>;
      if (typeof parsed.message === "string") {
        return {
          message: parsed.message,
          errors: parsed.errors,
        };
      }
    } catch {
      return {
        message: rawBody,
      };
    }

    return defaultError;
  }

  private parseRetryAfterSeconds(response: Response): number | undefined {
    const retryAfterRaw = response.headers?.get?.("retry-after");
    if (!retryAfterRaw) {
      return undefined;
    }

    const parsed = Number.parseInt(retryAfterRaw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }
}
