import { AppTableCard } from "@/shared/ui/app/app-table";
import { Skeleton } from "@/shared/ui/skeleton";

export function ApiSecurityKeysSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-10 w-full sm:max-w-sm" />
        <Skeleton className="h-10 w-36" />
      </div>

      <AppTableCard
        heading={<Skeleton className="h-5 w-24" />}
        footer={
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        }
      >
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="grid grid-cols-[2.2fr_0.9fr_1.3fr_1fr_0.8fr] gap-4 rounded-lg border border-gray-100 px-3 py-3 dark:border-gray-800"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-20" />
              <div className="flex justify-end gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-8 w-14" />
              </div>
            </div>
          ))}
        </div>
      </AppTableCard>
    </div>
  );
}
