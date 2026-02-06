import * as React from "react";

import { cn } from "@/shared/lib/utils";

export function AppStatusPill({
  statusCode,
  className,
}: {
  statusCode: number;
  className?: string;
}) {
  const isSuccess = statusCode >= 200 && statusCode < 300;
  const isClientError = statusCode >= 400 && statusCode < 500;
  const isServerError = statusCode >= 500;

  let colorClass =
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800";
  let dotColor = "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]";

  if (isClientError) {
    colorClass =
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    dotColor = "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.35)]";
  } else if (isServerError) {
    colorClass =
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    dotColor = "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium border",
        colorClass,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", dotColor)} />
      {statusCode}
    </span>
  );
}

