import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteFile } from "../api/delete";
import { projectKeys } from "@/features/projects/model/query-keys";

interface UseDeleteFileMutationOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useDeleteFile = (options?: UseDeleteFileMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, fileId }: { projectId: string; fileId: string }) =>
      deleteFile({ projectId, fileId }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.byId(variables.projectId),
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

// 이전 함수명과의 호환성을 위한 별칭
export const useDeleteImage = useDeleteFile;
