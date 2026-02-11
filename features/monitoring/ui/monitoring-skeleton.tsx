import { AppCard } from "@/shared/ui/app/app-card";
import { Skeleton } from "@/shared/ui/skeleton";

export function MonitoringSkeleton() {
  return (
    <div className="space-y-6">
      <AppCard className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Skeleton className="h-9 w-full sm:w-28" />
            <Skeleton className="h-9 w-full sm:w-40" />
          </div>
        </div>
      </AppCard>

      <AppCard className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </AppCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <AppCard key={i} className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </AppCard>
        ))}
      </div>

      <AppCard className="p-5">
        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-[280px] w-full rounded-lg" />
        </div>
      </AppCard>

      <AppCard className="p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-full sm:w-56" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </AppCard>
    </div>
  );
}
