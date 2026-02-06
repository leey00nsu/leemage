import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { AppCard } from "@/shared/ui/app/app-card";

interface AppTableCardProps extends React.ComponentProps<typeof AppCard> {
  heading: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
}

export function AppTableCard({
  heading,
  actions,
  footer,
  className,
  children,
  ...props
}: AppTableCardProps) {
  return (
    <AppCard
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {heading}
        </h3>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
      {footer ? (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
          {footer}
        </div>
      ) : null}
    </AppCard>
  );
}

export function AppTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <table
      className={cn("w-full text-left text-sm border-collapse", className)}
      {...props}
    />
  );
}
