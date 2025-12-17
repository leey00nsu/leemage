"use client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { ScrollFadeIn } from "@/shared/ui/scroll-fade-in";
import { ArrowRight, FileText, Upload, Wand2, FolderOpen, Code } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/shared/lib/utils";

interface FloatingCardProps {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  className?: string;
  delay?: number;
  floatDuration?: number;
}

function FloatingCard({
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

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className = "" }: HeroSectionProps) {
  const t = useTranslations("LandingHero");

  return (
    <section className={`relative py-20 md:py-32 overflow-hidden ${className}`}>
      {/* Floating cards */}
      <FloatingCard
        label={t("floatingCard1")}
        icon={<Upload className="w-5 h-5 text-white" />}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        className="hidden lg:block top-20 left-[10%]"
        delay={200}
        floatDuration={3}
      />
      <FloatingCard
        label={t("floatingCard2")}
        icon={<Wand2 className="w-5 h-5 text-white" />}
        gradient="bg-gradient-to-br from-purple-500 to-pink-500"
        className="hidden lg:block top-32 right-[10%]"
        delay={400}
        floatDuration={3.5}
      />
      <FloatingCard
        label={t("floatingCard3")}
        icon={<FolderOpen className="w-5 h-5 text-white" />}
        gradient="bg-gradient-to-br from-green-500 to-emerald-500"
        className="hidden lg:block bottom-32 left-[15%]"
        delay={600}
        floatDuration={4}
      />
      <FloatingCard
        label={t("floatingCard4")}
        icon={<Code className="w-5 h-5 text-white" />}
        gradient="bg-gradient-to-br from-orange-500 to-red-500"
        className="hidden lg:block bottom-20 right-[15%]"
        delay={800}
        floatDuration={3.2}
      />

      {/* Main content */}
      <div className="container mx-auto px-4 text-center relative z-10">
        <ScrollFadeIn>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {t("headline1")}
            </span>
            <br />
            <span className="text-gray-500 dark:text-gray-400">
              {t("headline2")}
            </span>
          </h1>
        </ScrollFadeIn>

        <ScrollFadeIn delay={100}>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 break-keep">
            {t("subtitle")}
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/projects">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                {t("primaryCta")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/api-docs">
              <Button size="lg" variant="outline">
                <FileText className="mr-2 h-5 w-5" />
                {t("secondaryCta")}
              </Button>
            </Link>
          </div>
        </ScrollFadeIn>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full blur-3xl opacity-50" />
      </div>
    </section>
  );
}
