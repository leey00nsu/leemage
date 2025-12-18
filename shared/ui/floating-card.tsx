import { cn } from "@/shared/lib/utils";

interface FloatingCardProps {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    className?: string;
    delay?: number;
    floatDuration?: number;
}

export function FloatingCard({
    label,
    icon,
    gradient,
    className = "",
    delay = 0,
    floatDuration = 3,
}: FloatingCardProps) {
    return (
        <div
            className={cn(
                "absolute z-20 flex flex-col items-center justify-center gap-2 px-5 py-4 rounded-xl shadow-xl backdrop-blur-sm",
                "bg-white/80 dark:bg-gray-800/80 border border-white/20",
                "opacity-0 animate-[fadeInFloat_0.6s_ease-out_forwards]",
                className
            )}
            style={{
                animationDelay: `${delay}ms`,
                ["--float-duration" as string]: `${floatDuration}s`,
            }}
        >
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mx-auto", gradient)}>
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center w-full">
                {label}
            </span>
        </div>
    );
}
