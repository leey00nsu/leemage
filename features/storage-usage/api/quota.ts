import { StorageQuotasResponse, SetQuotaRequest, StorageQuota } from "../model/types";

export async function getStorageQuotas(): Promise<StorageQuotasResponse> {
  const response = await fetch("/api/storage/quota");

  if (!response.ok) {
    throw new Error("Failed to fetch storage quotas");
  }

  return response.json();
}

export async function setStorageQuota(
  request: SetQuotaRequest
): Promise<StorageQuota> {
  const response = await fetch("/api/storage/quota", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to set storage quota");
  }

  return response.json();
}

export async function deleteStorageQuota(
  provider: "OCI" | "R2"
): Promise<void> {
  const response = await fetch(`/api/storage/quota?provider=${provider}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete storage quota");
  }
}
