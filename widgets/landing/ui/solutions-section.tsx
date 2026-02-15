"use client";

import { X, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { ScrollFadeIn } from "@/shared/ui/scroll-fade-in";

interface ComparisonRowProps {
  before: string;
  after: string;
  delay?: number;
}

function ComparisonRow({ before, after, delay = 0 }: ComparisonRowProps) {
  return (
    <ScrollFadeIn delay={delay}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center shrink-0">
            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm text-red-700 dark:text-red-300">{before}</span>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
          <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-800/50 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-sm text-green-700 dark:text-green-300">{after}</span>
        </div>
      </div>
    </ScrollFadeIn>
  );
}

interface SolutionsSectionProps {
  className?: string;
  labels: {
    title: string;
    subtitle: string;
    beforeLabel: string;
    afterLabel: string;
    compare1Before: string;
    compare1After: string;
    compare2Before: string;
    compare2After: string;
    compare3Before: string;
    compare3After: string;
    compare4Before: string;
    compare4After: string;
    compare5Before: string;
    compare5After: string;
  };
}

export function SolutionsSection({ className = "", labels }: SolutionsSectionProps) {
  const comparisons = [
    { before: labels.compare1Before, after: labels.compare1After },
    { before: labels.compare2Before, after: labels.compare2After },
    { before: labels.compare3Before, after: labels.compare3After },
    { before: labels.compare4Before, after: labels.compare4After },
    { before: labels.compare5Before, after: labels.compare5After },
  ];

  return (
    <section className={cn("py-20 bg-gray-50 dark:bg-gray-900/50", className)}>
      <div className="container mx-auto px-4">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {labels.title}
          </h2>
        </ScrollFadeIn>
        <ScrollFadeIn delay={100}>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {labels.subtitle}
          </p>
        </ScrollFadeIn>

        {/* Comparison Headers */}
        <ScrollFadeIn delay={200}>
          <div className="max-w-4xl mx-auto mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center font-semibold text-red-600 dark:text-red-400">
                {labels.beforeLabel}
              </div>
              <div className="text-center font-semibold text-green-700 dark:text-green-300">
                {labels.afterLabel}
              </div>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Comparison Rows */}
        <div className="max-w-4xl mx-auto space-y-4">
          {comparisons.map((comparison, index) => (
            <ComparisonRow key={index} {...comparison} delay={300 + index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
}
