import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadImageFn } from "../api";

export const useUploadImageMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadImageFn,
    onSuccess: (data) => {
      toast.success(`이미지 "${data.name}" 업로드 성공!`);
      // 이미지 목록을 다시 불러오기 위해 프로젝트 쿼리를 무효화합니다.
      // 직접 쿼리 키를 지정합니다. ProjectDetailsWidget 에서 사용하는 키와 일치시킵니다.
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
