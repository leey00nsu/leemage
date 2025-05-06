"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface CopyImageUrlButtonProps {
  url: string;
}

export function CopyImageUrlButton({ url }: CopyImageUrlButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        toast.success("URL이 클립보드에 복사되었습니다.");
        setTimeout(() => setCopied(false), 1500);
      })
      .catch((err) => {
        console.error("URL 복사 실패:", err);
        toast.error("URL 복사에 실패했습니다.");
      });
  };

  return (
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
  );
}
