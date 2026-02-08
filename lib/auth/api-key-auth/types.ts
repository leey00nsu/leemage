import type { ApiKeyPermission } from "@/shared/config/api-key-permissions";

export interface ValidatedApiKey {
  id: string;
  userIdentifier: string;
  name: string | null;
  prefix: string;
  permissions: ApiKeyPermission[];
}
