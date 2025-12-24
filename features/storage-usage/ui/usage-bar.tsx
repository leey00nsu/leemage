"use client";

import { getUsageColor } from "@/shared/lib/storage-quota-utils";

interface UsageBarProps {
    percentage: number | undefined;
    segments?: number;
    className?: string;
}

export function UsageBar({
    percentage,
    segments = 50,
    className = "",
}: UsageBarProps) {
    const progress = percentage !== undefined ? Math.min(100, Math.max(0, percentage)) : 0;
    const filledSegments = Math.round((progress / 100) * segments);
    const color = getUsageColor(percentage);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex gap-0.5">
                {Array.from({ length: segments }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 flex-1 rounded-sm transition-colors duration-300"
                        style={{
                            backgroundColor: i < filledSegments ? color : "#e5e7eb",
                            minWidth: "3px",
                        }}
                    />
                ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
                <span style={{ color }}>
                    {percentage !== undefined ? `${Math.round(percentage)}%` : "-"}
                </span>
                <span>100%</span>
            </div>
        </div>
    );
}
