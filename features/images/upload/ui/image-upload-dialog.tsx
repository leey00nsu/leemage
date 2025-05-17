"use client";

import { useState, ChangeEvent, FormEvent } from "react";
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
import { Progress } from "@/shared/ui/progress";
import { Checkbox } from "@/shared/ui/checkbox";
import { useUploadImage } from "../model/upload";
import { toast } from "sonner";

// 선택 가능한 옵션 정의 (API에서 사용한 값과 일치)
const AVAILABLE_SIZES = ["300x300", "800x800", "1920x1080"] as const;
const AVAILABLE_FORMATS = ["png", "jpeg", "avif", "webp"] as const;

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
    new Set(["webp"])
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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

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

    console.log("Sending FormData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

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
      setSelectedFormats(new Set(["webp"]));
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-file" className="text-right">
                파일
              </Label>
              <Input
                id="image-file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="col-span-3"
                disabled={uploadMutation.isPending}
              />
            </div>
            {selectedFile && (
              <div className="col-span-4 text-sm text-muted-foreground">
                선택: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
            <div className="space-y-4 rounded-md border p-4">
              <h4 className="mb-2 font-medium leading-none">변환 옵션</h4>
              <div className="space-y-2">
                <Label>크기 (Size)</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {AVAILABLE_SIZES.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <Checkbox
                        id={`size-${size}`}
                        checked={selectedSizes.has(size)}
                        onCheckedChange={(checked: boolean | string) =>
                          handleSizeChange(size, checked)
                        }
                        disabled={uploadMutation.isPending}
                      />
                      <label
                        htmlFor={`size-${size}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {size}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>포맷 (Format)</Label>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {AVAILABLE_FORMATS.map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <Checkbox
                        id={`format-${format}`}
                        checked={selectedFormats.has(format)}
                        onCheckedChange={(checked: boolean | string) =>
                          handleFormatChange(format, checked)
                        }
                        disabled={uploadMutation.isPending}
                      />
                      <label
                        htmlFor={`format-${format}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {format.toUpperCase()}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="save-original"
                  checked={saveOriginal}
                  onCheckedChange={(checked: boolean | string) =>
                    setSaveOriginal(checked === true)
                  }
                  disabled={uploadMutation.isPending}
                />
                <label
                  htmlFor="save-original"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  원본 이미지 저장
                </label>
              </div>
            </div>
            {uploadMutation.isPending && (
              <div className="col-span-4 space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">
                  업로드 중...
                </p>
              </div>
            )}
            {uploadMutation.isError && (
              <p className="col-span-4 text-sm text-red-600 text-center">
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : "업로드 중 오류 발생"}
              </p>
            )}
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
