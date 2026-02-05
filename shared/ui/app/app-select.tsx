"use client";

import * as React from "react";

import { cn } from "@/shared/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface AppSelectOption {
  label: string;
  value: string;
}

interface AppSelectProps {
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  onChange: (value: string) => void;
  options: AppSelectOption[];
  value: string;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}

export function AppSelect({
  className,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  triggerClassName,
  contentClassName,
  "aria-label": ariaLabel,
}: AppSelectProps) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        className={cn(
          "h-9 w-auto min-w-[9rem]",
          "flex items-center gap-2 px-3 py-1.5",
          "bg-white dark:bg-gray-900",
          "border border-gray-200 dark:border-gray-700 rounded-md",
          "text-sm font-medium text-slate-600 dark:text-slate-300",
          "hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          className,
          triggerClassName
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg",
          contentClassName
        )}
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className={cn(
              "rounded-md focus:bg-gray-100 focus:text-slate-900 dark:focus:bg-gray-800 dark:focus:text-white"
            )}
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
