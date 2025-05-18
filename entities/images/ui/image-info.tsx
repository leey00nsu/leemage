import { ImageVariantData, ImageWithVariants } from "../model/types"; // 경로 수정
import { formatBytes } from "@/shared/lib/image-utils"; // 경로 수정
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Ruler, FileBox, Calendar, Check, Copy } from "lucide-react";
import { ImageVariantList } from "./image-variant-list"; // 경로 수정
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { Button } from "@/shared/ui/button";

interface ImageInfoProps {
  image: ImageWithVariants;
  displayVariant: ImageVariantData;
}

export function ImageInfo({ image, displayVariant }: ImageInfoProps) {
  const { copied, handleCopy } = useCopyToClipboard({
    text: displayVariant.url,
    onSuccessCallback: () => {
      toast.success("URL이 클립보드에 복사되었습니다.");
    },
  });

  return (
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
        <div
          onClick={handleCopy}
          className="flex items-center justify-between gap-2 cursor-pointer"
        >
          <p className="text-xs text-muted-foreground break-all">
            <span className="font-medium text-foreground">
              URL ({displayVariant.label}):
            </span>{" "}
            {displayVariant.url}
          </p>
          <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
            {copied ? (
              <Check className="h-3 w-3 text-green-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* 저장된 버전 목록 컴포넌트 사용 */}
      <ImageVariantList
        variants={image.variants}
        displayVariantLabel={displayVariant.label}
      />
    </div>
  );
}
