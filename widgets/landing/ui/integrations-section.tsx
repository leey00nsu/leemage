"use client";

import { useTranslations } from "next-intl";
import { OrbitingCircles } from "@/shared/ui/orbiting-circles";
import { ScrollFadeIn } from "@/shared/ui/scroll-fade-in";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  NextJsIcon,
  PrismaIcon,
  OracleIcon,
  CloudflareIcon,
  PostgreSQLIcon,
} from "@/shared/ui/icons/tech-icons";

interface IntegrationsSectionProps {
  className?: string;
}

export function IntegrationsSection({
  className = "",
}: IntegrationsSectionProps) {
  const t = useTranslations("IntegrationsSection");

  return (
    <TooltipProvider>
      <section className={`py-20 bg-gray-50 dark:bg-gray-900/50 ${className}`}>
        <div className="container mx-auto px-4">
          <ScrollFadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              {t("title")}
            </h2>
          </ScrollFadeIn>

          <ScrollFadeIn delay={100}>
            <div className="relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden">
              {/* Inner orbit */}
              <OrbitingCircles iconSize={45} radius={80} duration={20}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <OracleIcon className="h-12 w-12" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Oracle Cloud Infrastructure</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <CloudflareIcon className="h-12 w-12" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Cloudflare R2</TooltipContent>
                </Tooltip>
              </OrbitingCircles>

              {/* Outer orbit */}
              <OrbitingCircles iconSize={50} radius={160} duration={30} reverse>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <NextJsIcon className="h-10 w-10" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Next.js</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <PrismaIcon className="h-10 w-10" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>Prisma</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <PostgreSQLIcon className="h-12 w-12" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>PostgreSQL</TooltipContent>
                </Tooltip>
              </OrbitingCircles>

              {/* Center logo */}
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-200 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                <img
                  src="/logo.webp"
                  alt="Leemage"
                  className="h-12 w-12 object-contain"
                />
              </div>
            </div>
          </ScrollFadeIn>
        </div>
      </section>
    </TooltipProvider>
  );
}
