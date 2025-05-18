"use client";

import { ImageWithVariants } from "@/entities/images/model/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDeleteImage } from "../model/delete";

interface DeleteImageDialogProps {
  image: ImageWithVariants;
}

export function DeleteImageDialog({ image }: DeleteImageDialogProps) {
  const router = useRouter();

  const deleteMutation = useDeleteImage({
    onSuccessCallback: () => {
      toast.success("이미지가 삭제되었습니다.");
      router.push(`/projects/${image.projectId}`);
    },
    onErrorCallback: () => {
      toast.error("이미지 삭제 중 오류가 발생했습니다.");
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ projectId: image.projectId, imageId: image.id });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon"
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">이미지 삭제</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
          <AlertDialogDescription>
            이 작업은 되돌릴 수 없습니다. 이미지가 영구적으로 삭제됩니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? "삭제 중..." : "삭제 확인"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
