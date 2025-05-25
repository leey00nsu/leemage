import { KeyRound } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { ReactNode } from "react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ApiKeyStatus");

  if (hasApiKey && apiKeyPrefix) {
    return (
      <div className="flex items-center justify-between p-3 bg-muted rounded-md w-full">
        <div className="flex items-center">
          <KeyRound className="h-5 w-5 mr-2 text-muted-foreground" />
          <span className="font-mono text-sm">{t("apiKeySet")}</span>
        </div>
        {children}
      </div>
    );
  }

  return (
    <Alert>
      <AlertTitle>{t("noApiKeyTitle")}</AlertTitle>
      <AlertDescription>{t("noApiKeyDescription")}</AlertDescription>
    </Alert>
  );
}
