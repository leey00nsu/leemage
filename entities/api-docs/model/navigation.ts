import type { ApiCategory, ApiEndpoint } from "./types";

export type StaticDocKey =
  | "doc:introduction"
  | "doc:authentication"
  | "doc:rate-limits"
  | "doc:sdk";

export type ActiveItemKey = StaticDocKey | `endpoint:${string}`;

export const GETTING_STARTED_DOCS = {
  introduction: "doc:introduction",
  authentication: "doc:authentication",
  "rate-limits": "doc:rate-limits",
} as const satisfies Record<string, StaticDocKey>;

export type GettingStartedSlug = keyof typeof GETTING_STARTED_DOCS;

export interface FlattenedEndpoint {
  key: ActiveItemKey;
  categoryName: string;
  categoryDescription: string;
  endpoint: ApiEndpoint;
}

const ENDPOINT_PARAM_PREFIX = "__param__";

export function flattenApiDocs(apiDocs: ApiCategory[]): FlattenedEndpoint[] {
  return apiDocs.flatMap((category) =>
    category.endpoints.map((endpoint) => ({
      key: getEndpointActiveKey(endpoint.method, endpoint.path),
      categoryName: category.name,
      categoryDescription: category.description,
      endpoint,
    })),
  );
}

export function getEndpointActiveKey(
  method: string,
  path: string,
): `endpoint:${string}` {
  return `endpoint:${method.toUpperCase()} ${path}`;
}

export function parseEndpointActiveKey(
  key: ActiveItemKey,
): { method: string; path: string } | null {
  if (!key.startsWith("endpoint:")) {
    return null;
  }

  const raw = key.slice("endpoint:".length);
  const firstSpace = raw.indexOf(" ");
  if (firstSpace <= 0) {
    return null;
  }

  const method = raw.slice(0, firstSpace).toUpperCase();
  const path = raw.slice(firstSpace + 1);

  return { method, path };
}

function encodePathSegment(segment: string): string {
  const parameterMatch = segment.match(/^\{(.+)\}$/);
  if (parameterMatch?.[1]) {
    return `${ENDPOINT_PARAM_PREFIX}${parameterMatch[1]}`;
  }
  return segment;
}

function decodePathSegment(segment: string): string {
  if (segment.startsWith(ENDPOINT_PARAM_PREFIX)) {
    const name = segment.slice(ENDPOINT_PARAM_PREFIX.length);
    return `{${name}}`;
  }
  return segment;
}

export function encodeEndpointPathToRouteSegments(path: string): string[] {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(encodePathSegment(segment)));
}

export function decodeEndpointPathFromRouteSegments(segments: string[]): string {
  const normalized = segments.map((segment) =>
    decodePathSegment(decodeURIComponent(segment)),
  );
  return `/${normalized.join("/")}`;
}

export function getHrefByActiveKey(activeItemKey: ActiveItemKey): string {
  switch (activeItemKey) {
    case "doc:introduction":
      return "/api-docs/getting-started/introduction";
    case "doc:authentication":
      return "/api-docs/getting-started/authentication";
    case "doc:rate-limits":
      return "/api-docs/getting-started/rate-limits";
    case "doc:sdk":
      return "/api-docs/sdk";
    default: {
      const parsed = parseEndpointActiveKey(activeItemKey);
      if (!parsed) {
        return "/api-docs/getting-started/introduction";
      }
      return getEndpointHref(parsed.method, parsed.path);
    }
  }
}

export function getEndpointHref(method: string, path: string): string {
  const methodSegment = method.toLowerCase();
  const pathSegments = encodeEndpointPathToRouteSegments(path);
  return `/api-docs/reference/${methodSegment}/${pathSegments.join("/")}`;
}
