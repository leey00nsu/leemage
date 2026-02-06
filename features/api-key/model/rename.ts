import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameApiKey } from "../api/rename";
import { apiKeyKeys } from "./query-keys";

interface RenameApiKeyVariables {
  apiKeyId: string;
  name: string;
}

interface UseRenameApiKeyOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useRenameApiKey = (options?: UseRenameApiKeyOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ apiKeyId, name }: RenameApiKeyVariables) =>
      renameApiKey(apiKeyId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all() });
      options?.onSuccessCallback?.();
    },
    onError: (err) => {
      options?.onErrorCallback?.(err);
    },
  });
};
