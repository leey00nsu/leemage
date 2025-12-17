"use client";

import { useEffect, useState } from "react";
import { Terminal, TypingAnimation, AnimatedSpan } from "@/shared/ui/terminal";

export function RestApiAnimation() {
    const [key, setKey] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setKey((prev) => prev + 1);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-center p-6">
            <Terminal key={key} className="w-full max-w-sm h-auto">
                <TypingAnimation delay={0} duration={30}>
                    $ curl -X GET /api/v1/projects
                </TypingAnimation>
                <AnimatedSpan delay={1500} className="text-green-500">
                    {"{"} &quot;projects&quot;: [...] {"}"}
                </AnimatedSpan>
                <TypingAnimation delay={2500} duration={30}>
                    $ curl -X POST /api/v1/files
                </TypingAnimation>
                <AnimatedSpan delay={4000} className="text-green-500">
                    {"{"} &quot;url&quot;: &quot;presigned...&quot; {"}"}
                </AnimatedSpan>
            </Terminal>
        </div>
    );
}
