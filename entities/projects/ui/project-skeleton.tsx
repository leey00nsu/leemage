import { AppCard } from "@/shared/ui/app/app-card";
import { CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProjectSkeletonProps {
  count?: number;
}

export function ProjectSkeleton({ count = 3 }: ProjectSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(count)].map((_, i) => (
        <AppCard key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </AppCard>
      ))}
    </div>
  );
}
