import { AppCard } from "@/shared/ui/app/app-card";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { useTranslations } from "next-intl";

export const ApiKeySkeleton = () => {
  const t = useTranslations("ApiKeySkeleton");
  return (
    <AppCard className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("loadingDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-44" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-9 w-28" />
        </div>
      </CardContent>
    </AppCard>
  );
};
