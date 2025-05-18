import { KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { ReactNode } from "react";

interface ApiKeyStatusProps {
  hasApiKey: boolean;
  apiKeyPrefix?: string | null;
  children?: ReactNode;
}

export function ApiKeyStatus({
  hasApiKey,
  apiKeyPrefix,
  children,
}: ApiKeyStatusProps) {
  if (hasApiKey && apiKeyPrefix) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted rounded-md w-full">
        <div className="flex items-center">
          <KeyRound className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-mono text-sm">API 키가 설정되어 있습니다</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <Alert>
      <AlertTitle>API 키 없음</AlertTitle>
      <AlertDescription>
        현재 시스템에 설정된 API 키가 없습니다. 외부 연동을 위해 새 키를
        생성하세요.
      </AlertDescription>
    </Alert>
  );
}
