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
import { useRouter } from "@/i18n/navigation";
import { useDeleteImage } from "../model/delete";
import { useTranslations } from "next-intl";

interface DeleteImageDialogProps {
  image: ImageWithVariants;
}

export function DeleteImageDialog({ image }: DeleteImageDialogProps) {
  const router = useRouter();
  const t = useTranslations("DeleteImageDialog");

  const deleteMutation = useDeleteImage({
    onSuccessCallback: () => {
      toast.success(t("deleteSuccess"));
      router.push(`/projects/${image.projectId}`);
    },
    onErrorCallback: () => {
      toast.error(t("deleteError"));
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
          <span className="sr-only">{t("deleteImageSr")}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMutation.isPending}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? t("deleting") : t("confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
