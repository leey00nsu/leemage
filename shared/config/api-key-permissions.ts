export const API_KEY_PERMISSIONS = ["read", "write", "delete"] as const;

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const DEFAULT_API_KEY_PERMISSIONS: ApiKeyPermission[] = [
  "read",
  "write",
  "delete",
];

export const API_METHOD_PERMISSION_MAP: Partial<Record<string, ApiKeyPermission>> = {
  GET: "read",
  HEAD: "read",
  OPTIONS: "read",
  POST: "write",
  PUT: "write",
  PATCH: "write",
  DELETE: "delete",
};

export function getRequiredPermissionForMethod(
  method: string,
): ApiKeyPermission | null {
  return API_METHOD_PERMISSION_MAP[method.toUpperCase()] ?? null;
}
