import { useMutation, useQueryClient } from "@tanstack/react-query";
import { imageKeys } from "../../model/query-keys";
import { deleteImage } from "../api/delete";

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
        queryKey: imageKeys.byProjectId(variables.projectId),
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
