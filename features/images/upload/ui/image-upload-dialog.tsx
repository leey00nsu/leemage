"use client";

import { useState, FormEvent } from "react";
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

interface ImageUploadDialogProps {
  projectId: string;
  children: React.ReactNode;
}

export function ImageUploadDialog({
  projectId,
  children,
}: ImageUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(
    new Set([AVAILABLE_FORMATS[3]])
  );
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(
    new Set(AVAILABLE_SIZES)
  );
  const [saveOriginal, setSaveOriginal] = useState<boolean>(true);

  const uploadMutation = useUploadImage(projectId, {
    onSuccessCallback: () => {
      toast.success(`이미지 "${selectedFile?.name}" 업로드 성공!`);
      setSelectedFile(null);
      setIsOpen(false);
    },
    onErrorCallback: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleFormatChange = (format: string, checked: boolean | string) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (checked === true) {
        next.add(format);
      } else {
        next.delete(format);
      }
      return next;
    });
  };

  const handleSizeChange = (size: string, checked: boolean | string) => {
    setSelectedSizes((prev) => {
      const next = new Set(prev);
      if (checked === true) {
        next.add(size);
      } else {
        next.delete(size);
      }
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.warning("업로드할 파일을 선택해주세요.");
      return;
    }
    if (selectedFormats.size === 0 || selectedSizes.size === 0) {
      toast.warning("최소 하나 이상의 포맷과 크기를 선택해야 합니다.");
      return;
    }

    const requestedVariants = Array.from(selectedSizes).flatMap((sizeLabel) =>
      Array.from(selectedFormats).map((format) => ({ sizeLabel, format }))
    );

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("variants", JSON.stringify(requestedVariants));
    formData.append("saveOriginal", JSON.stringify(saveOriginal));

    uploadMutation.mutate(
      {
        formData,
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          setIsOpen(false);
        },
      }
    );
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedFile(null);
      setSelectedFormats(new Set([AVAILABLE_FORMATS[3]]));
      setSelectedSizes(new Set(AVAILABLE_SIZES));
      setSaveOriginal(true);
      uploadMutation.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 이미지 업로드</DialogTitle>
          <DialogDescription>
            파일을 선택하고 생성할 이미지 버전 옵션을 선택하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <FileInput
              onChange={setSelectedFile}
              selectedFile={selectedFile}
              disabled={uploadMutation.isPending}
              id="image-file"
              label="파일"
            />

            <TransformOptions
              selectedSizes={selectedSizes}
              selectedFormats={selectedFormats}
              saveOriginal={saveOriginal}
              onSizeChange={handleSizeChange}
              onFormatChange={handleFormatChange}
              onSaveOriginalChange={(checked) =>
                setSaveOriginal(checked === true)
              }
              disabled={uploadMutation.isPending}
            />

            <UploadProgress
              isUploading={uploadMutation.isPending}
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
                disabled={uploadMutation.isPending}
              >
                취소
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={!selectedFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "업로드 중..." : "업로드"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
