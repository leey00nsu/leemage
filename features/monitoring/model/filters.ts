export type StatusFilter = "all" | "success" | "error";
export type MethodFilter = "all" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
export type ActorFilter = "ui" | "apiKey:unknown" | `apiKey:${string}`;
export type StatusCodeClassFilter = "2xx" | "3xx" | "4xx" | "5xx";

export interface AdvancedLogFilters {
  statusCodeClasses: StatusCodeClassFilter[];
  latencyMinMs?: number;
  latencyMaxMs?: number;
  metadataKeyword: string;
}

export const DEFAULT_ADVANCED_LOG_FILTERS: AdvancedLogFilters = {
  statusCodeClasses: [],
  metadataKeyword: "",
};

export const ALL_METHODS: MethodFilter[] = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "PATCH",
];
