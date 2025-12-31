"use client";

import { useState, useEffect, useMemo } from "react";
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
import { usePresignedUpload } from "../model/presigned-upload";
import { toast } from "sonner";
import {
  AVAILABLE_FORMATS,
  AVAILABLE_SIZES,
} from "@/shared/config/image-options";
import { TransformOptions } from "@/entities/files/ui/image/transform-options";
import { FileInput } from "@/entities/files/ui/file-input";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUploadFormValues, createFileUploadSchema } from "../model/schema";
import { useTranslations } from "next-intl";
import { isImageFile } from "@/shared/lib/file-utils";
import { Progress } from "@/shared/ui/progress";
import { Loader2, X, CheckCircle, AlertCircle } from "lucide-react";

type FormatType = (typeof AVAILABLE_FORMATS)[number];
type SizeType = (typeof AVAILABLE_SIZES)[number];

interface FileUploadDialogProps {
  projectId: string;
  children: React.ReactNode;
}

export function FileUploadDialog({
  projectId,
  children,
}: FileUploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fileState, setFileState] = useState<File | null>(null);
  const [isImage, setIsImage] = useState(false);
  const [customResolutions, setCustomResolutions] = useState<string[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const t = useTranslations("ImageUploadDialog");
  const tValidation = useTranslations("Validation");

  // i18n 스키마 생성
  const schema = useMemo(
    () => createFileUploadSchema((key) => tValidation(key)),
    [tValidation]
  );

  // react-hook-form 설정
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FileUploadFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      formats: [AVAILABLE_FORMATS[0]],
      sizes: [
        AVAILABLE_SIZES.find((s) => s === "source") || AVAILABLE_SIZES[0],
      ],
      customResolutions: [],
    },
    mode: "onChange",
  });

  // Presigned Upload 훅
  const {
    status,
    progress,
    error,
    upload,
    cancel,
    reset: resetUpload,
    isUploading,
  } = usePresignedUpload({
    projectId,
    onSuccess: () => {
      toast.success(t("uploadSuccess", { fileName: fileState?.name || "" }));
      setIsOpen(false);
      setFileState(null);
    },
    onError: (error: Error) => {
      if (error.message !== "업로드가 취소되었습니다.") {
        toast.error(error.message);
      }
    },
  });

  // 포맷, 사이즈 상태 관찰
  const selectedFormats = watch("formats") || [];
  const selectedSizes = watch("sizes") || [];

  // 파일이 이미지인지 확인
  useEffect(() => {
    if (fileState) {
      setIsImage(isImageFile(fileState));
    } else {
      setIsImage(false);
    }
  }, [fileState]);

  // 폼 유효성 검사 (프리셋 사이즈 또는 커스텀 해상도 중 하나 이상 선택)
  const hasValidSizes = selectedSizes.length > 0 || customResolutions.length > 0;
  const isFormValid =
    Object.keys(errors).length === 0 &&
    fileState &&
    (!isImage || (selectedFormats.length > 0 && hasValidSizes)) &&
    !isUploading;

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

  // 커스텀 해상도 추가 핸들러
  const handleCustomResolutionAdd = (resolution: string) => {
    if (!customResolutions.includes(resolution)) {
      const newResolutions = [...customResolutions, resolution];
      setCustomResolutions(newResolutions);
      setValue("customResolutions", newResolutions, { shouldValidate: true });
    }
  };

  // 커스텀 해상도 제거 핸들러
  const handleCustomResolutionRemove = (resolution: string) => {
    const newResolutions = customResolutions.filter((r) => r !== resolution);
    setCustomResolutions(newResolutions);
    setValue("customResolutions", newResolutions, { shouldValidate: true });
  };

  // 폼 제출 핸들러
  const onSubmit: SubmitHandler<FileUploadFormValues> = (data) => {
    const { file, formats, sizes } = data;

    if (!file) {
      toast.warning(t("selectFileWarning"));
      return;
    }

    // 이미지 파일인 경우 variants 생성
    let variants;
    if (isImage && formats) {
      // 프리셋 사이즈와 커스텀 해상도 합치기
      const allSizes = [...(sizes || []), ...customResolutions];
      variants = allSizes.flatMap((sizeLabel) =>
        formats.map((format) => ({ sizeLabel, format }))
      );
    }

    upload(file, variants);
  };

  // 다이얼로그 상태 변경 핸들러
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset({
        formats: [AVAILABLE_FORMATS[0]],
        sizes: [
          AVAILABLE_SIZES.find((s) => s === "source") || AVAILABLE_SIZES[0],
        ],
        customResolutions: [],
      });
      setFileState(null);
      setIsImage(false);
      setCustomResolutions([]);
      setImageDimensions(null);
      resetUpload();
    }
  };

  // 업로드 취소 핸들러
  const handleCancel = () => {
    cancel();
    toast.info("업로드가 취소되었습니다.");
  };

  // 상태별 메시지
  const getStatusMessage = () => {
    switch (status) {
      case "presigning":
        return "업로드 준비 중...";
      case "uploading":
        return `업로드 중... ${progress}%`;
      case "confirming":
        return "업로드 완료 확인 중...";
      case "processing":
        return "이미지 처리 중...";
      case "complete":
        return "업로드 완료!";
      case "error":
        return error || "업로드 실패";
      default:
        return "";
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
              disabled={isUploading}
              id="file-input"
              label={t("fileInputLabel")}
              accept="*/*"
              onDimensionsLoad={setImageDimensions}
            />
            {errors.file && (
              <p className="text-sm text-destructive pl-[25%]">
                {errors.file.message}
              </p>
            )}

            {/* 이미지 파일인 경우에만 변환 옵션 표시 */}
            {isImage && (
              <>
                <TransformOptions
                  selectedSizes={new Set(selectedSizes)}
                  selectedFormats={new Set(selectedFormats)}
                  customResolutions={customResolutions}
                  onSizeChange={handleSizeChange}
                  onFormatChange={handleFormatChange}
                  onCustomResolutionAdd={handleCustomResolutionAdd}
                  onCustomResolutionRemove={handleCustomResolutionRemove}
                  disabled={isUploading}
                  originalWidth={imageDimensions?.width}
                  originalHeight={imageDimensions?.height}
                />
                {errors.formats && (
                  <p className="text-sm text-destructive">
                    {errors.formats.message}
                  </p>
                )}
                {errors.sizes && (
                  <p className="text-sm text-destructive">
                    {errors.sizes.message}
                  </p>
                )}
              </>
            )}

            {/* 비이미지 파일 안내 메시지 */}
            {fileState && !isImage && (
              <p className="text-sm text-muted-foreground">
                {t("nonImageFileInfo") ||
                  "이 파일은 원본 그대로 업로드됩니다."}
              </p>
            )}

            {/* 업로드 진행 상태 */}
            {status !== "idle" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : status === "complete" ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span
                    className={`text-sm ${status === "error" ? "text-destructive" : ""}`}
                  >
                    {getStatusMessage()}
                  </span>
                </div>
                {(status === "uploading" || status === "presigning") && (
                  <Progress value={progress} className="h-2" />
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            {isUploading ? (
              <Button type="button" variant="destructive" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                취소
              </Button>
            ) : (
              <>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={isUploading}>
                    {t("cancelButton")}
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={!isFormValid}>
                  {t("uploadButton")}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
