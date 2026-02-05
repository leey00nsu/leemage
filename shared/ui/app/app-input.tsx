import * as React from "react";

import { cn } from "@/shared/lib/utils";

export const AppInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full pl-4 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm",
        "text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

AppInput.displayName = "AppInput";

