import { useMutation, useQueryClient } from "@tanstack/react-query";
import { generateApiKey } from "../api/generate";
import { apiKeyKeys } from "./query-keys";

interface UseGenerateApiKeyOptions {
  onSuccessCallback?: (newKey: string) => void;
  onErrorCallback?: (error: Error) => void;
}

export const useGenerateApiKey = (options?: UseGenerateApiKeyOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateApiKey,
    onSuccess: (newKey) => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all() });
      if (options?.onSuccessCallback) {
        options.onSuccessCallback(newKey);
      }
    },
    onError: (err) => {
      if (options?.onErrorCallback) {
        options.onErrorCallback(err);
      }
    },
  });
};
