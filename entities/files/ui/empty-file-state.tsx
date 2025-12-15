import { FileIcon } from "lucide-react";
import { useTranslations } from "next-intl";

interface EmptyFileStateProps {
  message?: string;
}

export function EmptyFileState({ message }: EmptyFileStateProps) {
  const t = useTranslations("EmptyFileState");
  const displayMessage = message || t("noFiles");

  return (
    <div className="border rounded-lg p-8 text-center border-dashed">
      <FileIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
      <p className="text-muted-foreground">{displayMessage}</p>
    </div>
  );
}
