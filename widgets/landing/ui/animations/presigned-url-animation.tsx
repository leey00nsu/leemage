"use client";

import { forwardRef, useRef } from "react";
import { AnimatedBeam } from "@/shared/ui/animated-beam";
import { FolderOpen } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { AppLogo } from "@/shared/ui/app/app-logo";
import { OciIcon, R2Icon } from "./storage-icons";

const Circle = forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex size-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
                className
            )}
        >
            {children}
        </div>
    );
});
Circle.displayName = "Circle";

export function PresignedUrlAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const project1Ref = useRef<HTMLDivElement>(null);
    const project2Ref = useRef<HTMLDivElement>(null);
    const project3Ref = useRef<HTMLDivElement>(null);
    const leemageRef = useRef<HTMLDivElement>(null);
    const ociRef = useRef<HTMLDivElement>(null);
    const r2Ref = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center p-8"
        >
            <div className="flex size-full max-w-md flex-row items-center justify-between">
                {/* Left column - Projects */}
                <div className="flex flex-col items-center justify-between h-full py-4">
                    <Circle ref={project1Ref} className="size-10">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                    </Circle>
                    <Circle ref={project2Ref} className="size-10">
                        <FolderOpen className="h-5 w-5 text-green-600" />
                    </Circle>
                    <Circle ref={project3Ref} className="size-10">
                        <FolderOpen className="h-5 w-5 text-purple-600" />
                    </Circle>
                </div>

                {/* Center - Leemage */}
                <Circle ref={leemageRef} className="size-14 border-blue-500">
                    <AppLogo size={32} className="h-8 w-8" />
                </Circle>

                {/* Right column - Storage providers */}
                <div className="flex flex-col items-center justify-center gap-8">
                    <Circle ref={ociRef} className="size-10">
                        <OciIcon className="h-6 w-6" />
                    </Circle>
                    <Circle ref={r2Ref} className="size-10">
                        <R2Icon className="h-6 w-6" />
                    </Circle>
                </div>
            </div>

            {/* Projects to Leemage */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={project1Ref}
                toRef={leemageRef}
                curvature={-50}
                gradientStartColor="#3b82f6"
                gradientStopColor="#8b5cf6"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={project2Ref}
                toRef={leemageRef}
                gradientStartColor="#22c55e"
                gradientStopColor="#3b82f6"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={project3Ref}
                toRef={leemageRef}
                curvature={50}
                gradientStartColor="#a855f7"
                gradientStopColor="#3b82f6"
            />

            {/* Leemage to Storage */}
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={leemageRef}
                toRef={ociRef}
                curvature={50}
                gradientStartColor="#3b82f6"
                gradientStopColor="#C74634"
            />
            <AnimatedBeam
                containerRef={containerRef}
                fromRef={leemageRef}
                toRef={r2Ref}
                curvature={-50}
                gradientStartColor="#3b82f6"
                gradientStopColor="#F4811F"
            />
        </div>
    );
}
