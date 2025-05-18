"use client";

import { ImageVariantData } from "../model/types"; // 경로 수정
import { formatBytes } from "@/shared/lib/image-utils"; // 경로 수정
import { toast } from "sonner";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { Button } from "@/shared/ui/button";
import { Check, Copy } from "lucide-react";

interface ImageVariantListItemProps {
  variant: ImageVariantData;
  isDisplayed: boolean; // 현재 메인으로 표시되는 버전인지 여부
}

export function ImageVariantListItem({
  variant,
  isDisplayed,
}: ImageVariantListItemProps) {
  const { copied, handleCopy } = useCopyToClipboard({
    text: variant.url,
    onSuccessCallback: () => {
      toast.success("URL이 클립보드에 복사되었습니다.");
    },
  });

  return (
    <li className="p-2 border rounded-md bg-muted/50 space-y-1">
      <div className="flex justify-between items-center mb-1">
        <span className={`font-medium ${isDisplayed ? "text-primary" : ""}`}>
          {variant.label.toUpperCase()} ({variant.format.toUpperCase()})
        </span>
        <span className="text-muted-foreground">
          {variant.width}x{variant.height} px
        </span>
      </div>
      <div className="flex justify-between items-center text-muted-foreground">
        <span>{formatBytes(variant.size)}</span>
      </div>
      <div
        onClick={handleCopy}
        className="flex items-center justify-between gap-2 cursor-pointer"
      >
        <span
          className="break-all text-muted-foreground flex-1 "
          title={variant.url}
        >
          {variant.url}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0" // 버튼 크기 조정
          onClick={handleCopy}
          title="URL 복사"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          <span className="sr-only">URL 복사</span>
        </Button>
      </div>
    </li>
  );
}
