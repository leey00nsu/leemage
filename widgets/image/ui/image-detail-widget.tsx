"use client"; // next/image 사용 및 클라이언트 인터랙션 가능성을 위해

import { useState } from "react"; // useState 임포트 추가
import { Image as PrismaImageType } from "@/lib/generated/prisma";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Calendar,
  FileBox,
  ImageIcon,
  Ruler,
  Trash2,
  Copy,
  Check,
} from "lucide-react"; // Copy, Check 아이콘 추가
import { format } from "date-fns"; // 날짜 포맷팅 라이브러리
import { ko } from "date-fns/locale"; // 한국어 로케일
import { Button } from "@/shared/ui/button";
import { toast } from "sonner"; // toast 임포트 추가
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

// ImageVariantData 타입 정의 (ImageList와 동일, 공유 타입으로 분리 권장)
type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};
type ImageWithVariants = Omit<PrismaImageType, "variants"> & {
  variants: ImageVariantData[];
};

interface ImageDetailsWidgetProps {
  image: ImageWithVariants; // 수정된 타입 사용
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

// Helper 함수: variants 배열에서 특정 레이블의 variant 찾기 (ImageList와 동일)
function findVariantByLabel(
  variants: ImageVariantData[],
  label: string
): ImageVariantData | undefined {
  return variants.find((v) => v.label === label);
}

export function ImageDetailsWidget({ image }: ImageDetailsWidgetProps) {
  const deleteMutation = useDeleteImageMutation();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null); // 복사 상태 관리

  // 표시할 메인 variant 선택 (예: large, 없으면 첫 번째)
  const displayVariant =
    findVariantByLabel(image.variants, "large") || image.variants[0];

  const handleDelete = () => {
    deleteMutation.mutate({ projectId: image.projectId, imageId: image.id });
  };

  // URL 복사 핸들러
  const handleCopyUrl = (urlToCopy: string) => {
    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setCopiedUrl(urlToCopy); // 복사된 URL 상태 업데이트
        toast.success("URL이 클립보드에 복사되었습니다.");
        setTimeout(() => setCopiedUrl(null), 1500); // 1.5초 후 상태 초기화
      })
      .catch((err) => {
        console.error("URL 복사 실패:", err);
        toast.error("URL 복사에 실패했습니다.");
      });
  };

  // 표시할 variant가 없는 경우 처리
  if (!displayVariant) {
    return (
      <Card className="container mx-auto py-8 px-4">
        <CardHeader>
          <CardTitle>이미지 정보 없음</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            이미지 버전을 표시할 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="truncate" title={image.name}>
              {image.name}
            </CardTitle>
            <Badge variant="secondary" className="w-fit mt-1">
              {displayVariant.format.toUpperCase()}
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
          {/* 이미지 표시 영역 - 선택된 variant 사용 */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
            <Image
              src={displayVariant.url} // variant URL 사용
              alt={image.name}
              width={displayVariant.width} // variant width 사용
              height={displayVariant.height} // variant height 사용
              className="object-contain" // 비율 유지
              // sizes="..." // 필요 시 재계산
            />
          </div>

          {/* 상세 정보 영역 - 선택된 variant 정보 사용 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">상세 정보</h3>
            <div className="flex items-center text-sm text-muted-foreground">
              <Ruler className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                크기: {displayVariant.width} x {displayVariant.height} px
              </span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <FileBox className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>
                파일: {displayVariant.format.toUpperCase()} (
                {formatBytes(displayVariant.size)})
              </span>
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
                <span className="font-medium text-foreground">
                  URL ({displayVariant.label}):
                </span>{" "}
                {displayVariant.url}
              </p>
            </div>

            {/* --- 저장된 버전 목록 추가 --- */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-md font-semibold mb-3">저장된 버전</h4>
              {image.variants && image.variants.length > 0 ? (
                <ul className="space-y-2 text-xs">
                  {image.variants.map((variant, index) => (
                    <li
                      key={index}
                      className="p-2 border rounded-md bg-muted/50 space-y-1"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`font-medium ${
                            variant.label === displayVariant.label
                              ? "text-primary"
                              : ""
                          }`}
                        >
                          {/* 레이블 강조 (선택적) */}
                          {variant.label.toUpperCase()} (
                          {variant.format.toUpperCase()})
                        </span>
                        <span className="text-muted-foreground">
                          {variant.width}x{variant.height} px
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>{formatBytes(variant.size)}</span>
                      </div>
                      {/* URL 표시 및 복사 버튼 */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="break-all text-muted-foreground flex-1"
                          title={variant.url}
                        >
                          {variant.url} {/* 전체 URL 표시 */}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0" // 버튼 크기 조정
                          onClick={() => handleCopyUrl(variant.url)}
                          title="URL 복사"
                        >
                          {copiedUrl === variant.url ? (
                            <Check className="h-3 w-3 text-green-600" /> // 복사 완료 아이콘
                          ) : (
                            <Copy className="h-3 w-3" /> // 기본 복사 아이콘
                          )}
                          <span className="sr-only">URL 복사</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  저장된 버전 정보가 없습니다.
                </p>
              )}
            </div>
            {/* --- --- --- --- --- */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
