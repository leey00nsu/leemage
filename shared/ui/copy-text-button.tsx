"use client";

import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyTextButtonProps {
  text: string;
  title?: string;
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export function CopyTextButton({
  text,
  title = "복사",
  onSuccessCallback,
  onErrorCallback,
}: CopyTextButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        onSuccessCallback?.();
        setTimeout(() => setCopied(false), 1500);
      })
      .catch((err) => {
        onErrorCallback?.(err);
      });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 flex-shrink-0" // 버튼 크기 조정
      onClick={handleCopy}
      title={title}
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      <span className="sr-only">{title}</span>
    </Button>
  );
}
