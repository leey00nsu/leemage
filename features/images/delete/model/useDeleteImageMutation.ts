import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteImageFn } from "../api";
import { useRouter } from "next/navigation";

export const useDeleteImageMutation = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: deleteImageFn,
    onSuccess: (data, variables) => {
      toast.success(data.message || "이미지가 삭제되었습니다.");

      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });

      router.push(`/projects/${variables.projectId}`);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "이미지 삭제 중 오류가 발생했습니다."
      );
    },
  });
};
