import { useMutation, useQueryClient } from "@tanstack/react-query";
import { renameApiKey } from "../api/rename";
import { apiKeyKeys } from "./query-keys";
import type { ApiKeyPermission } from "@/shared/config/api-key-permissions";

interface RenameApiKeyVariables {
  apiKeyId: string;
  name: string;
  permissions: ApiKeyPermission[];
}

interface UseRenameApiKeyOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useRenameApiKey = (options?: UseRenameApiKeyOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RenameApiKeyVariables) => renameApiKey(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeyKeys.all() });
      options?.onSuccessCallback?.();
    },
    onError: (err) => {
      options?.onErrorCallback?.(err);
    },
  });
};
