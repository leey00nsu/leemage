import type { ApiEndpoint } from "@/entities/api-docs/model/types";

export function getEndpointDisplayPath(endpoint: ApiEndpoint): string {
  return endpoint.fullPath || endpoint.path;
}
