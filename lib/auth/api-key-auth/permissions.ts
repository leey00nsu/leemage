import {
  getRequiredPermissionForMethod,
  type ApiKeyPermission,
} from "@/shared/config/api-key-permissions";

export function hasMethodPermission(
  method: string,
  permissions: ApiKeyPermission[],
): boolean {
  const requiredPermission = getRequiredPermissionForMethod(method);
  if (!requiredPermission) {
    return true;
  }

  return permissions.includes(requiredPermission);
}
