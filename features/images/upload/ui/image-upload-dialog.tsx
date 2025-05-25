"use client";

import { useState } from "react";
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
import { useUploadImage } from "../model/upload";
import { toast } from "sonner";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";
import { TransformOptions } from "@/entities/images/upload/ui/transform-options";
import { UploadProgress } from "@/entities/images/upload/ui/upload-progress";
import { FileInput } from "@/entities/images/upload/ui/file-input";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageUploadFormValues, imageUploadSchema } from "../model/schema";
import { useTranslations } from "next-intl";

type FormatType = (typeof AVAILABLE_FORMATS)[number];
type SizeType = (typeof AVAILABLE_SIZES)[number];

interface ImageUploadDialogProps {
  projectId: string;
  children: React.ReactNode;
}

export function ImageUploadDialog({
  projectId,
  children,
}: ImageUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileState, setFileState] = useState<File | null>(null);
  const t = useTranslations("ImageUploadDialog");

  // react-hook-form 설정
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ImageUploadFormValues>({
    resolver: zodResolver(imageUploadSchema),
    defaultValues: {
      formats: [AVAILABLE_FORMATS[0]], // 기본 포맷 (예: png)
      sizes: [
        AVAILABLE_SIZES.find((s) => s === "original") || AVAILABLE_SIZES[0],
      ], // 기본으로 "original" 선택
    },
    mode: "onChange",
  });

  // API 요청 훅
  const uploadMutation = useUploadImage(projectId, {
    onSuccessCallback: () => {
      toast.success(t("uploadSuccess", { fileName: fileState?.name || "" }));
      setIsOpen(false);
      setFileState(null);
    },
    onErrorCallback: (error: Error) => {
      toast.error(error.message);
    },
  });

  // 포맷, 사이즈 상태 관찰
  const selectedFormats = watch("formats");
  const selectedSizes = watch("sizes");
  const isFormValid =
    Object.keys(errors).length === 0 &&
    fileState &&
    selectedFormats.length > 0 && // formats도 선택되었는지 확인
    selectedSizes.length > 0 && // sizes도 선택되었는지 확인
    !isSubmitting &&
    !uploadMutation.isPending;

  // 포맷 변경 핸들러
  const handleFormatChange = (format: string, checked: boolean | string) => {
    const formatValue = format as FormatType;
    const newFormats = [...selectedFormats];

    if (checked === true && !newFormats.includes(formatValue)) {
      newFormats.push(formatValue);
    } else if (checked !== true) {
      const index = newFormats.indexOf(formatValue);
      if (index !== -1) {
        newFormats.splice(index, 1);
      }
    }

    setValue("formats", newFormats, { shouldValidate: true });
  };

  // 사이즈 변경 핸들러
  const handleSizeChange = (size: string, checked: boolean | string) => {
    const sizeValue = size as SizeType;
    const newSizes = [...selectedSizes];

    if (checked === true && !newSizes.includes(sizeValue)) {
      newSizes.push(sizeValue);
    } else if (checked !== true) {
      const index = newSizes.indexOf(sizeValue);
      if (index !== -1) {
        newSizes.splice(index, 1);
      }
    }

    setValue("sizes", newSizes, { shouldValidate: true });
  };

  // 파일 변경 핸들러
  const handleFileChange = (file: File | null) => {
    setFileState(file);
    if (file) {
      setValue("file", file, { shouldValidate: true });
    }
  };

  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<ImageUploadFormValues> = (data) => {
    const { file, formats, sizes } = data;

    if (!file) {
      toast.warning(t("selectFileWarning"));
      return;
    }

    // Zod 스키마에서 이미 sizes와 formats 배열이 비어있지 않음을 검증함
    // if (sizes.length === 0 || formats.length === 0) {
    //   toast.warning("하나 이상의 크기와 포맷을 선택해야 합니다.");
    //   return;
    // }

    const requestedVariants = sizes.flatMap((sizeLabel) =>
      formats.map((format) => ({ sizeLabel, format }))
    );

    const formData = new FormData();
    formData.append("file", file);
    formData.append("variants", JSON.stringify(requestedVariants));
    // formData.append("saveOriginal", ...); // 제거

    uploadMutation.mutate({ formData });
  };

  // 다이얼로그 상태 변경 핸들러
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // 다이얼로그 닫을 때 폼 초기화
      reset({
        formats: [AVAILABLE_FORMATS[0]],
        sizes: [
          AVAILABLE_SIZES.find((s) => s === "original") || AVAILABLE_SIZES[0],
        ],
      });
      setFileState(null);
      uploadMutation.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FileInput
              onChange={handleFileChange}
              selectedFile={fileState}
              disabled={isSubmitting || uploadMutation.isPending}
              id="image-file"
              label={t("fileInputLabel")}
            />
            {errors.file && (
              <p className="text-sm text-destructive pl-[25%]">
                {errors.file.message}
              </p>
            )}

            <TransformOptions
              selectedSizes={new Set(selectedSizes)}
              selectedFormats={new Set(selectedFormats)}
              onSizeChange={handleSizeChange}
              onFormatChange={handleFormatChange}
              disabled={isSubmitting || uploadMutation.isPending}
            />
            {errors.formats && (
              <p className="text-sm text-destructive">
                {errors.formats.message}
              </p>
            )}
            {errors.sizes && (
              <p className="text-sm text-destructive">{errors.sizes.message}</p>
            )}

            <UploadProgress
              isUploading={isSubmitting || uploadMutation.isPending}
              error={
                uploadMutation.error instanceof Error
                  ? uploadMutation.error
                  : null
              }
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting || uploadMutation.isPending}
              >
                {t("cancelButton")}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isFormValid}>
              {isSubmitting || uploadMutation.isPending
                ? t("uploadingButton")
                : t("uploadButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
