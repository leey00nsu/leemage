"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

interface AppDrawerProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function AppDrawer({
  open,
  onOpenChange,
  children,
  className,
  title = "Drawer",
}: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-[560px] max-w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] [&>[data-slot=sheet-close]]:top-5 [&>[data-slot=sheet-close]]:right-5 [&>[data-slot=sheet-close]]:z-10",
          className
        )}
      >
        <SheetTitle className="sr-only">{title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
