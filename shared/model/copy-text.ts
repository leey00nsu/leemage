import { useState } from "react";

interface CopyToClipboardProps {
  text: string;
  onSuccessCallback?: () => void;
  onErrorCallback?: (error: Error) => void;
}

export const useCopyToClipboard = ({
  text,
  onSuccessCallback,
  onErrorCallback,
}: CopyToClipboardProps) => {
  const [copied, setCopied] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        onSuccessCallback?.();
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        setTimeoutId(setTimeout(() => setCopied(false), 1500));
      })
      .catch((err) => {
        onErrorCallback?.(err);
      });
  };

  return { copied, handleCopy };
};
