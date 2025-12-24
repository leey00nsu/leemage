import { Skeleton } from "@/shared/ui/skeleton";

interface ProjectDetailSkeletonProps {
  fileCount?: number;
}

export function ProjectDetailSkeleton({
  fileCount = 6,
}: ProjectDetailSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header: title and action buttons */}
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-8 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Project ID and storage badge */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-5 w-16" />
      </div>

      {/* Description */}
      <Skeleton className="h-4 w-2/3" />

      {/* Storage usage */}
      <Skeleton className="h-12 w-full rounded-lg" />

      {/* Upload button */}
      <div className="flex justify-start mb-4">
        <Skeleton className="h-9 w-32" />
      </div>

      {/* File card grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(fileCount)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
