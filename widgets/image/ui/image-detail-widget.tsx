"use client"; // next/image 사용 및 클라이언트 인터랙션 가능성을 위해

import { Image as ImageType } from "@/lib/generated/prisma";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Calendar, FileBox, Ruler, Trash2 } from "lucide-react";
import { format } from "date-fns"; // 날짜 포맷팅 라이브러리
import { ko } from "date-fns/locale"; // 한국어 로케일
import { Button } from "@/shared/ui/button";
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
import { useDeleteImageMutation } from "@/features/images/delete/model/useDeleteImageMutation";

interface ImageDetailsWidgetProps {
  image: ImageType;
}

// 파일 크기를 읽기 쉬운 형식으로 변환하는 함수
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function ImageDetailsWidget({ image }: ImageDetailsWidgetProps) {
  const deleteMutation = useDeleteImageMutation();

  const handleDelete = () => {
    deleteMutation.mutate({ projectId: image.projectId, imageId: image.id });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="truncate" title={image.name}>
              {image.name}
            </CardTitle>
            <Badge variant="secondary" className="w-fit mt-1">
              {image.format.toUpperCase()}
            </Badge>
          </div>
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
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-8">
          {/* 이미지 표시 영역 */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={image.url}
              alt={image.name}
              fill
              className="object-contain" // 이미지가 잘리지 않도록 contain 사용
              sizes="(max-width: 768px) 100vw, 50vw" // 반응형 크기 최적화
            />
          </div>

          {/* 상세 정보 영역 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">상세 정보</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Ruler className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>크기: {formatBytes(image.size)}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileBox className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>포맷: {image.format}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                업로드 날짜:{" "}
                {format(new Date(image.createdAt), "yyyy년 MM월 dd일 HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                최종 수정 날짜:{" "}
                {format(new Date(image.updatedAt), "yyyy년 MM월 dd일 HH:mm", {
                  locale: ko,
                })}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground break-all">
                <span className="font-medium text-foreground">URL:</span>{" "}
                {image.url}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
