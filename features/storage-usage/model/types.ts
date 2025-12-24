export type UsageStatus = "normal" | "warning" | "critical" | "unknown";

export interface StorageProviderUsage {
  provider: "OCI" | "R2";
  bytes: number;
  projects: number;
  files: number;
  quota?: number;
  percentage?: number;
  status: UsageStatus;
}

export interface StorageUsageResponse {
  providers: StorageProviderUsage[];
  total: {
    bytes: number;
    projects: number;
    files: number;
  };
}

export interface StorageQuota {
  provider: "OCI" | "R2";
  quotaBytes: number;
}

export interface StorageQuotasResponse {
  quotas: StorageQuota[];
}

export interface SetQuotaRequest {
  provider: "OCI" | "R2";
  quotaBytes: number;
}
