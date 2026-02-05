import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Card } from "@/shared/ui/card";

export function AppCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn(
        "bg-white dark:bg-gray-900 border-gray-200/70 dark:border-gray-800 shadow-sm",
        className
      )}
      {...props}
    />
  );
}

