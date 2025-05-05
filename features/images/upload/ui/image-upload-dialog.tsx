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
import { useUploadImageMutation } from "../model/useUploadImageMutation";
import { toast } from "sonner";

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

  const uploadMutation = useUploadImageMutation(projectId);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.warning("업로드할 파일을 선택해주세요.");
      return;
    }

    uploadMutation.mutate(
      { projectId, file: selectedFile },
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
      uploadMutation.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>새 이미지 업로드</DialogTitle>
          <DialogDescription>
            프로젝트에 새로운 이미지를 추가합니다. 이미지 파일을 선택하고 업로드
            버튼을 클릭하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image-file" className="text-right">
                이미지 파일
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
