import { StorageUsageResponse } from "../model/types";

export async function getStorageUsage(): Promise<StorageUsageResponse> {
  const response = await fetch("/api/storage/usage");

  if (!response.ok) {
    throw new Error("Failed to fetch storage usage");
  }

  return response.json();
}
