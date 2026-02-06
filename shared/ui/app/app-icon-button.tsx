import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { AppButton } from "@/shared/ui/app/app-button";

export function AppIconButton({
  className,
  ...props
}: React.ComponentProps<typeof AppButton>) {
  return (
    <AppButton
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
        className
      )}
      {...props}
    />
  );
}

