import { Grid2X2, List } from "lucide-react";

import { cn } from "@/shared/lib/utils";

export type AppViewMode = "grid" | "list";

interface AppViewToggleProps {
  value: AppViewMode;
  onChange: (value: AppViewMode) => void;
  className?: string;
}

export function AppViewToggle({ value, onChange, className }: AppViewToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "grid"
            ? "bg-white dark:bg-gray-700 shadow-sm text-slate-900 dark:text-white"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        )}
        aria-pressed={value === "grid"}
        aria-label="Grid view"
      >
        <Grid2X2 className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-1.5 rounded-md transition-colors",
          value === "list"
            ? "bg-white dark:bg-gray-700 shadow-sm text-slate-900 dark:text-white"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        )}
        aria-pressed={value === "list"}
        aria-label="List view"
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}

