"use client";

import { FileWithVariants } from "@/entities/files/model/types";
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
import { useDeleteFile } from "../model/delete";
import { useTranslations } from "next-intl";

interface DeleteFileDialogProps {
  file: FileWithVariants;
}

export function DeleteFileDialog({ file }: DeleteFileDialogProps) {
  const router = useRouter();
  const t = useTranslations("DeleteFileDialog");

  const deleteMutation = useDeleteFile({
    onSuccessCallback: () => {
      toast.success(t("deleteSuccess"));
      router.push(`/projects/${file.projectId}`);
    },
    onErrorCallback: () => {
      toast.error(t("deleteError"));
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ projectId: file.projectId, fileId: file.id });
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
          <span className="sr-only">{t("deleteFileSr")}</span>
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
