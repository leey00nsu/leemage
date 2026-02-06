import * as React from "react";

import { cn } from "@/shared/lib/utils";

interface AppPageHeaderProps extends React.ComponentProps<"div"> {
  heading: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

export function AppPageHeader({
  heading,
  description,
  actions,
  className,
  ...props
}: AppPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {heading}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
