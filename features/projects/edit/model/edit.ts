import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProject, UpdateProjectResponse } from "../api/edit";
import { EditProjectFormValues } from "./schema";
import { projectKeys } from "@/features/projects/model/query-keys";

interface UseUpdateProjectOptions {
  onSuccessCallback?: (data: UpdateProjectResponse) => void;
  onErrorCallback?: (error: Error) => void;
}

export function useUpdateProject(options?: UseUpdateProjectOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: EditProjectFormValues;
    }) => updateProject(projectId, data),
    onSuccess: (data) => {
      // 프로젝트 목록과 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: projectKeys.all() });
      queryClient.invalidateQueries({ queryKey: projectKeys.byId(data.id) });
      options?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      options?.onErrorCallback?.(error);
    },
  });
}
