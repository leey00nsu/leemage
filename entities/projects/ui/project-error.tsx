import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProjectErrorProps {
  message?: string;
}

export function ProjectError({ message }: ProjectErrorProps) {
  const t = useTranslations("ProjectError");
  const displayMessage = message || t("defaultError");

  return (
    <div className="border rounded-lg p-8 text-center border-destructive bg-destructive/10">
      <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
      <p className="text-destructive font-semibold">{t("fetchError")}</p>
      <p className="text-sm text-destructive/80">{displayMessage}</p>
    </div>
  );
}
