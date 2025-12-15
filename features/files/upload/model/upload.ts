import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile, ApiFileResponse } from "../api/upload";
import { projectKeys } from "@/features/projects/model/query-keys";

// mutate 함수에 전달될 변수 타입 정의
type UploadVariables = {
  formData: FormData;
};

interface UseUploadFileMutationOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useUploadFile = (
  projectId: string,
  options?: UseUploadFileMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiFileResponse, Error, UploadVariables>({
    mutationFn: (variables) =>
      uploadFile({ projectId, formData: variables.formData }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: projectKeys.byId(projectId),
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
export const useUploadImage = useUploadFile;
