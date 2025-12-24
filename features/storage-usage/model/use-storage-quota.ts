import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setStorageQuota, deleteStorageQuota } from "../api/quota";
import { storageUsageKeys } from "./query-keys";
import { SetQuotaRequest } from "./types";

export function useSetStorageQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SetQuotaRequest) => setStorageQuota(request),
    onSuccess: () => {
      // Invalidate usage query to refetch with new quota
      queryClient.invalidateQueries({ queryKey: storageUsageKeys.all });
    },
  });
}

export function useDeleteStorageQuota() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: "OCI" | "R2") => deleteStorageQuota(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storageUsageKeys.all });
    },
  });
}
