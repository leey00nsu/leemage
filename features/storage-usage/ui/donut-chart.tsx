"use client";

import { getUsageColor, USAGE_COLORS } from "@/shared/lib/storage-quota-utils";

interface DonutChartProps {
    percentage: number | undefined;
    size?: number;
    strokeWidth?: number;
    showLabel?: boolean;
    className?: string;
}

export function DonutChart({
    percentage,
    size = 80,
    strokeWidth = 8,
    showLabel = true,
    className = "",
}: DonutChartProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Calculate stroke dash offset for the progress
    const progress = percentage !== undefined ? Math.min(100, Math.max(0, percentage)) : 0;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const color = getUsageColor(percentage);
    const bgColor = USAGE_COLORS.unknown;

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    opacity={0.2}
                />
                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span
                        className="text-sm font-semibold"
                        style={{ color }}
                    >
                        {percentage !== undefined ? `${Math.round(percentage)}%` : "-"}
                    </span>
                </div>
            )}
        </div>
    );
}
