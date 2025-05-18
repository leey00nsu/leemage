import { Button } from "@/shared/ui/button";
import { KeyRound, Loader2 } from "lucide-react";

interface ApiKeyGenerateButtonProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ApiKeyGenerateButton({
  onGenerate,
  isGenerating,
}: ApiKeyGenerateButtonProps) {
  return (
    <Button onClick={onGenerate} disabled={isGenerating}>
      {isGenerating ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <KeyRound className="mr-2 h-4 w-4" />
      )}
      새 API 키 생성
    </Button>
  );
}
