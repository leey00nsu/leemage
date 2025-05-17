import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectKeys } from "../../model/query-keys";
import { deleteProject } from "../api/delete";

interface UseDeleteProjectOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useDeleteProject = (options?: UseDeleteProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all() });

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
