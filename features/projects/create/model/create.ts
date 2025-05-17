import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProject } from "../api/create";
import { projectKeys } from "../../model/query-keys";

interface UseCreateProjectOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useCreateProject = (options?: UseCreateProjectOptions) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.all() });

      if (options?.onSuccessCallback) {
        options.onSuccessCallback();
      }
    },
    onError: (error) => {
      console.error("Project creation mutation error:", error);

      if (options?.onErrorCallback) {
        options.onErrorCallback(error);
      }
    },
  });
};
