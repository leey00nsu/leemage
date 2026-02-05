import * as React from "react";

import { cn } from "@/shared/lib/utils";

export function AppAssetCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "group relative flex flex-col bg-white dark:bg-gray-900 rounded-lg",
        "border border-gray-200 dark:border-gray-800 overflow-hidden",
        "hover:shadow-md hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-200",
        className
      )}
      {...props}
    />
  );
}

