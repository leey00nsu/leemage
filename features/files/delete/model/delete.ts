import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFiles } from "../api/delete";
import { projectKeys } from "@/features/projects/model/query-keys";

interface UseDeleteFileMutationOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useDeleteFile = (options?: UseDeleteFileMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, fileId }: { projectId: string; fileId: string }) =>
      deleteFiles({ projectId, fileIds: [fileId] }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.all(),
      });

      if (options?.onSuccessCallback) {
        options.onSuccessCallback();
      }
    },
    onError: (error) => {
      if (options?.onErrorCallback) {
        options.onErrorCallback(error);
      }
    },
  });
};
