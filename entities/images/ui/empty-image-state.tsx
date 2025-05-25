import { ImageIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyImageStateProps {
  message?: string;
}

export function EmptyImageState({ message }: EmptyImageStateProps) {
  const t = useTranslations("EmptyImageState");
  const displayMessage = message || t("noImages");

  return (
    <div className="border rounded-lg p-8 text-center border-dashed">
      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{displayMessage}</p>
    </div>
  );
}
