import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteApiKey } from "../api/delete";
import { apiKeyKeys } from "./query-keys";

interface UseDeleteApiKeyOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useDeleteApiKey = (options?: UseDeleteApiKeyOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all() });
      if (options?.onSuccessCallback) {
        options.onSuccessCallback();
      }
    },
    onError: (err) => {
      if (options?.onErrorCallback) {
        options.onErrorCallback(err);
      }
    },
  });
};
