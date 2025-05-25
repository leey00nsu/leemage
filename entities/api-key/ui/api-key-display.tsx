import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Check, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface ApiKeyDisplayProps {
  apiKey: string;
}

export function ApiKeyDisplay({ apiKey }: ApiKeyDisplayProps) {
  const t = useTranslations("ApiKeyDisplay");
  const [copied, setCopied] = useState(false);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard
      .writeText(apiKey)
      .then(() => {
        setCopied(true);
        toast.success(t("keyCopied"));
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast.error(t("copyFailed"));
      });
  };

  return (
    <Alert variant="default">
      <AlertTitle className="flex items-center">
        <CheckCircle className="h-5 w-5 mr-2 text-green-600 flex-shrink-0" />
        <AlertTitle className="text-sm">{t("newKeyGenerated")}</AlertTitle>
      </AlertTitle>

      <AlertDescription className="break-all">
        {t("newKeyDescription")}
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
          <span className="sr-only">{t("copy")}</span>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
