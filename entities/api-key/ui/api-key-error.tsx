import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { useTranslations } from "next-intl";

interface ApiKeyErrorProps {
  errorMessage: string | null;
}

export function ApiKeyError({ errorMessage }: ApiKeyErrorProps) {
  const t = useTranslations("ApiKeyError");
  if (!errorMessage) return null;

  return (
    <Alert variant="destructive">
      <AlertTitle>{t("title")}</AlertTitle>
      <AlertDescription>{errorMessage}</AlertDescription>
    </Alert>
  );
}
