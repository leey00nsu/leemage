import { useTranslations } from "next-intl";

interface EmptyProjectStateProps {
  message?: string;
}

export function EmptyProjectState({ message }: EmptyProjectStateProps) {
  const t = useTranslations("EmptyProjectState");
  const displayMessage = message || t("defaultMessage");

  return (
    <div className="border rounded-lg p-8 text-center border-dashed">
      <p className="text-muted-foreground whitespace-pre-line">
        {displayMessage}
      </p>
    </div>
  );
}
