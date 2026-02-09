import { AppAssetCard } from "@/shared/ui/app/app-asset-card";
import { Skeleton } from "@/shared/ui/skeleton";

interface AppProjectCardSkeletonProps {
  layout?: "grid" | "list";
}

export function AppProjectCardSkeleton({
  layout = "grid",
}: AppProjectCardSkeletonProps) {
  if (layout === "list") {
    return (
      <AppAssetCard className="flex-row overflow-hidden">
        <div className="h-24 w-24 shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex-1 p-3">
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          <Skeleton className="mt-2 h-3 w-3/4" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </AppAssetCard>
    );
  }

  return (
    <AppAssetCard>
      <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="p-3">
        <Skeleton className="h-4 w-2/3" />
        <div className="mt-2 space-y-1.5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </AppAssetCard>
  );
}

