import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadImageFn, ApiImageResponse } from "../api";

// mutate 함수에 전달될 변수 타입 정의 (FormData 직접 사용)
type UploadVariables = {
  formData: FormData;
};

export const useUploadImageMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApiImageResponse, Error, UploadVariables>({
    // mutate 변수 타입 명시
    mutationFn: (variables) =>
      uploadImageFn({ projectId, formData: variables.formData }), // projectId와 formData 전달
    onSuccess: (data) => {
      // data 객체 (ApiImageResponse 타입) 사용 가능
      toast.success(`이미지 "${data.name}" 업로드 성공!`); // 원본 이름 사용
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "이미지 업로드 중 오류가 발생했습니다."
      );
    },
  });
};
