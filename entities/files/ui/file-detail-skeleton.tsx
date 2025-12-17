import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface FileDetailSkeletonProps {
  variantCount?: number;
}

export function FileDetailSkeleton({ variantCount = 3 }: FileDetailSkeletonProps) {
  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-2">
            {/* Title */}
            <Skeleton className="h-6 w-48" />
            {/* Badge */}
            <Skeleton className="h-5 w-16" />
          </div>
          {/* Delete button */}
          <Skeleton className="h-9 w-9" />
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Preview area */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* File info section */}
            <div className="space-y-4">
              {/* Info items */}
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>

              {/* Variants list */}
              <div className="space-y-2 pt-4">
                <Skeleton className="h-5 w-24 mb-3" />
                {[...Array(variantCount)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
