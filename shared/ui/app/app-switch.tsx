"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Switch } from "@/shared/ui/switch";

export function AppSwitch({
  className,
  ...props
}: React.ComponentProps<typeof Switch>) {
  return (
    <Switch
      className={cn(
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300 dark:data-[state=unchecked]:bg-slate-700",
        className,
      )}
      {...props}
    />
  );
}
