"use client";

import { Image as ImageIcon, ArrowRight } from "lucide-react";

export function ImageTransformAnimation() {
    return (
        <div className="absolute inset-0 flex items-center justify-center gap-6 p-8">
            <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                    PNG 2MB
                </span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 items-center gap-1">
                    <ArrowRight className="h-6 w-6 text-blue-500 animate-pulse" />
                    <ArrowRight className="h-6 w-6 text-blue-500 animate-pulse [animation-delay:100ms]" />
                    <ArrowRight className="h-6 w-6 text-blue-500 animate-pulse [animation-delay:200ms]" />
                </div>
                <span className="text-xs text-transparent font-medium">
                    placeholder
                </span>
            </div>

            <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-lg shadow-blue-500/20 animate-pulse">
                        <ImageIcon className="h-6 w-6 text-blue-600" />
                    </div>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                    WebP 200KB
                </span>
            </div>
        </div>
    );
}
