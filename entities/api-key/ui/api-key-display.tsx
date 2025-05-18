import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Check, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface ApiKeyDisplayProps {
  apiKey: string;
}

export function ApiKeyDisplay({ apiKey }: ApiKeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard
      .writeText(apiKey)
      .then(() => {
        setCopied(true);
        toast.success("API 키가 클립보드에 복사되었습니다.");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error("클립보드 복사에 실패했습니다.");
      });
  };

  return (
    <Alert variant="default">
      <AlertTitle className="flex items-center">
        <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
        <AlertTitle className="text-sm">새 API 키 생성됨</AlertTitle>
      </AlertTitle>

      <AlertDescription className="break-all">
        다음은 새로 생성된 API 키입니다. 이 키는 다시 표시되지 않으니 반드시
        안전한 곳에 복사하여 보관하세요.
      </AlertDescription>

      <AlertDescription className="p-3 bg-muted rounded-md flex items-center justify-between break-all">
        <span
          className="font-mono text-sm text-muted-foreground"
          title={apiKey || ""}
        >
          {apiKey || ""}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleCopyKey}
          disabled={copied}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">복사</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
