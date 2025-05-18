import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImage, ApiImageResponse } from "../api/upload";
import { projectKeys } from "@/features/projects/model/query-keys";

// mutate 함수에 전달될 변수 타입 정의 (FormData 직접 사용)
type UploadVariables = {
  formData: FormData;
};

interface UseUploadImageMutationOptions {
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useUploadImage = (
  projectId: string,
  options?: UseUploadImageMutationOptions
) => {
  const queryClient = useQueryClient();

  return useMutation<ApiImageResponse, Error, UploadVariables>({
    // mutate 변수 타입 명시
    mutationFn: (variables) =>
      uploadImage({ projectId, formData: variables.formData }), // projectId와 formData 전달
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
