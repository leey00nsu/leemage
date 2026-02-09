"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

export function AppCheckbox({
  className,
  ...props
}: React.ComponentProps<typeof Checkbox>) {
  return (
    <Checkbox
      className={cn(
        "border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        className,
      )}
      {...props}
    />
  );
}
