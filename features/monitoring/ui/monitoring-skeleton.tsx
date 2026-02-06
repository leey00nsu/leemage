import { AppCard } from "@/shared/ui/app/app-card";

export function MonitoringSkeleton() {
  return (
    <div className="space-y-6">
      <AppCard className="p-6 h-28" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AppCard className="h-32" />
        <AppCard className="h-32" />
        <AppCard className="h-32" />
      </div>
      <AppCard className="h-16" />
      <AppCard className="h-[320px]" />
      <AppCard className="h-[360px]" />
    </div>
  );
}

