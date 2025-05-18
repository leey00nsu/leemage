import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteImage } from "../api/delete";
import { projectKeys } from "@/features/projects/model/query-keys";

interface UseDeleteImageMutationOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useDeleteImage = (options?: UseDeleteImageMutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteImage,
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
