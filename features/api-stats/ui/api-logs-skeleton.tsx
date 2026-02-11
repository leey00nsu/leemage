import { Skeleton } from "@/shared/ui/skeleton";
import { AppCard } from "@/shared/ui/app/app-card";
import { CardContent } from "@/shared/ui/card";

export function ApiLogsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-48" />
      </div>
      <AppCard>
        <CardContent className="pt-4 pb-2">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </AppCard>
      <Skeleton className="h-10 w-48" />
      <AppCard>
        <CardContent className="p-0">
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </AppCard>
    </div>
  );
}
