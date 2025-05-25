import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export const ApiKeySkeleton = () => {
  const t = useTranslations("ApiKeySkeleton");
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("loadingDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center items-center min-h-[10rem]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </CardContent>
    </Card>
  );
};
