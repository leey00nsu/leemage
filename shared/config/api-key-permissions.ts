export const API_KEY_PERMISSIONS = ["read", "write", "delete"] as const;

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const DEFAULT_API_KEY_PERMISSIONS: ApiKeyPermission[] = [
  "read",
  "write",
  "delete",
];
