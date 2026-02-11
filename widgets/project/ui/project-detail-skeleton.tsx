import { Skeleton } from "@/shared/ui/skeleton";

interface ProjectDetailSkeletonProps {
  fileCount?: number;
}

export function ProjectDetailSkeleton({
  fileCount = 6,
}: ProjectDetailSkeletonProps) {
  return (
    <div className="mx-auto max-w-[1600px] px-2 py-2 sm:px-4">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-full max-w-[20rem] sm:max-w-[26rem]" />
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Skeleton className="h-4 w-full max-w-[14rem] sm:w-64" />
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      {/* Storage usage bar */}
      <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Search and filter bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="relative max-w-sm w-full md:w-auto flex-1 min-w-[250px]">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1">
            <Skeleton className="h-9 min-w-[9rem] w-[9rem]" />
            <Skeleton className="h-9 min-w-[9rem] w-[9rem]" />
            <Skeleton className="h-9 min-w-[9rem] w-[9rem]" />
          </div>
          <Skeleton className="h-9 w-[4.5rem]" />
        </div>
      </div>

      {/* File card grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {[...Array(fileCount)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
