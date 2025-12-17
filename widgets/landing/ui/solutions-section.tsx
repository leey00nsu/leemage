"use client";

import { X, Check } from "lucide-react";
import { useTranslations } from "next-intl";
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
}

export function SolutionsSection({ className = "" }: SolutionsSectionProps) {
  const t = useTranslations("SolutionsSection");

  const comparisons = [
    { before: t("compare1Before"), after: t("compare1After") },
    { before: t("compare2Before"), after: t("compare2After") },
    { before: t("compare3Before"), after: t("compare3After") },
    { before: t("compare4Before"), after: t("compare4After") },
    { before: t("compare5Before"), after: t("compare5After") },
  ];

  return (
    <section className={cn("py-20 bg-gray-50 dark:bg-gray-900/50", className)}>
      <div className="container mx-auto px-4">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t("title")}
          </h2>
        </ScrollFadeIn>
        <ScrollFadeIn delay={100}>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </ScrollFadeIn>

        {/* Comparison Headers */}
        <ScrollFadeIn delay={200}>
          <div className="max-w-4xl mx-auto mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="text-center font-semibold text-red-600 dark:text-red-400">
                {t("beforeLabel")}
              </div>
              <div className="text-center font-semibold text-green-600 dark:text-green-400">
                {t("afterLabel")}
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
