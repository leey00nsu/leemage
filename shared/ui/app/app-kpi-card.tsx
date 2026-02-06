import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { AppCard } from "@/shared/ui/app/app-card";

interface AppKpiCardProps extends React.ComponentProps<typeof AppCard> {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export function AppKpiCard({
  label,
  value,
  icon,
  trend,
  className,
  ...props
}: AppKpiCardProps) {
  return (
    <AppCard
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-primary/30 transition-colors",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon ? <span className="text-slate-400">{icon}</span> : null}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
            {value}
          </span>
          {trend ? (
            <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              {trend}
            </span>
          ) : null}
        </div>
      </div>
    </AppCard>
  );
}

