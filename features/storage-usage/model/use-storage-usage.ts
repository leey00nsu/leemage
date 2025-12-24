import { useQuery } from "@tanstack/react-query";
import { getStorageUsage } from "../api/get-storage-usage";
import { storageUsageKeys } from "./query-keys";

export function useStorageUsage() {
  return useQuery({
    queryKey: storageUsageKeys.usage(),
    queryFn: getStorageUsage,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
