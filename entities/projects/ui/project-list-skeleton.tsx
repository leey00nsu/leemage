import { Card, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProjectListSkeletonProps {
  count?: number;
}

export function ProjectListSkeleton({ count = 3 }: ProjectListSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and filter skeleton */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-[180px]" />
      </div>

      {/* Project card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(count)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
