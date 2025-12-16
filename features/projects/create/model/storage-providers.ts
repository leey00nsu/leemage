import { useQuery } from "@tanstack/react-query";
import { getAvailableStorageProviders } from "../api/storage-providers";

export const storageProviderKeys = {
  available: () => ["storage-providers", "available"],
};

export function useAvailableStorageProviders() {
  return useQuery({
    queryKey: storageProviderKeys.available(),
    queryFn: getAvailableStorageProviders,
    staleTime: 1000 * 60 * 5, // 5분간 캐시
  });
}
