"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  createEditProjectSchema,
  EditProjectFormValues,
} from "../model/schema";
import { useUpdateProject } from "../model/edit";
import { toast } from "sonner";
import { UploadPolicyFields } from "@/features/projects/ui/upload-policy-fields";
import { useTranslations } from "next-intl";

interface EditProjectDialogProps {
  projectId: string;
  currentName: string;
  currentDescription: string | null;
  currentMaxUploadBytes?: number;
  currentVideoThumbnailEnabled?: boolean;
  children: React.ReactNode;
}

export function EditProjectDialog({
  projectId,
  currentName,
  currentDescription,
  currentMaxUploadBytes = 50 * 1024 * 1024,
  currentVideoThumbnailEnabled = true,
  children,
}: EditProjectDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("EditProjectDialog");
  const tValidation = useTranslations("Validation");

  // i18n 스키마 생성
  const schema = useMemo(
    () => createEditProjectSchema((key) => tValidation(key)),
    [tValidation],
  );

  const {
    control,
    setValue,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentName,
      description: currentDescription || "",
      maxUploadBytes: currentMaxUploadBytes,
      videoThumbnailEnabled: currentVideoThumbnailEnabled,
    },
  });

  const maxUploadBytes = useWatch({ control, name: "maxUploadBytes" });
  const videoThumbnailEnabled = useWatch({
    control,
    name: "videoThumbnailEnabled",
  });

  // 다이얼로그가 열릴 때 현재 값으로 폼 리셋
  useEffect(() => {
    if (isOpen) {
      reset({
        name: currentName,
        description: currentDescription || "",
        maxUploadBytes: currentMaxUploadBytes,
        videoThumbnailEnabled: currentVideoThumbnailEnabled,
      });
    }
  }, [
    isOpen,
    currentName,
    currentDescription,
    currentMaxUploadBytes,
    currentVideoThumbnailEnabled,
    reset,
  ]);

  const { mutate: updateProject, isPending } = useUpdateProject({
    onSuccessCallback: () => {
      toast.success(t("updateSuccessToast"));
      setIsOpen(false);
    },
    onErrorCallback: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = (data: EditProjectFormValues) => {
    updateProject({ projectId, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">{t("nameLabel")}</Label>
              <Input
                id="name"
                placeholder={t("namePlaceholder")}
                {...register("name")}
                disabled={isPending}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">{t("descriptionLabel")}</Label>
              <Textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                {...register("description")}
                className="min-h-[100px]"
                disabled={isPending}
              />
              {errors.description && (
                <p className="text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
            <UploadPolicyFields
              maxUploadBytes={maxUploadBytes}
              videoThumbnailEnabled={videoThumbnailEnabled}
              onLimitChange={(v) =>
                setValue("maxUploadBytes", v, { shouldValidate: true })
              }
              onThumbnailChange={(v) => setValue("videoThumbnailEnabled", v)}
              disabled={isPending}
            />
            {errors.maxUploadBytes && (
              <p className="text-xs text-destructive">
                {errors.maxUploadBytes.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isPending}>
                {t("cancelButton")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("savingButton") : t("saveButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
