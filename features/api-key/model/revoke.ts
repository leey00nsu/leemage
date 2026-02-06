import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeApiKey } from "../api/revoke";
import { apiKeyKeys } from "./query-keys";

interface UseRevokeApiKeyOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useRevokeApiKey = (options?: UseRevokeApiKeyOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all() });
      options?.onSuccessCallback?.();
    },
    onError: (err) => {
      options?.onErrorCallback?.(err);
    },
  });
};
