"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";

interface ScrollFadeInProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    threshold?: number;
    once?: boolean;
}

export function ScrollFadeIn({
    children,
    className,
    delay = 0,
    duration = 600,
    threshold = 0.1,
    once = true,
}: ScrollFadeInProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) {
                        observer.unobserve(element);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold, once]);

    return (
        <div
            ref={ref}
            className={cn(
                "transition-all ease-out",
                isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8",
                className
            )}
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}
