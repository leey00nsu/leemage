import { Button } from "@/shared/ui/button";
import { KeyRound, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface ApiKeyGenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ApiKeyGenerateButton({
  onGenerate,
  isGenerating,
}: ApiKeyGenerateButtonProps) {
  const t = useTranslations("ApiKeyGenerateButton");
  return (
    <Button onClick={onGenerate} disabled={isGenerating} className="w-full">
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <KeyRound className="mr-2 h-4 w-4" />
      )}
      {t("generateNewKey")}
    </Button>
  );
}
