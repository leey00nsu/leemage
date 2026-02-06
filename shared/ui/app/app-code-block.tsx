import * as React from "react";

import { cn } from "@/shared/lib/utils";

export function AppCodeBlock({
  className,
  ...props
}: React.ComponentProps<"pre">) {
  return (
    <pre
      className={cn(
        "p-4 text-xs font-mono overflow-x-auto text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-gray-950",
        className
      )}
      {...props}
    />
  );
}

