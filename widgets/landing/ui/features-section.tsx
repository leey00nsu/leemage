"use client";

import { useTranslations } from "next-intl";
import { BentoCard, BentoGrid } from "@/shared/ui/bento-grid";
import { ScrollFadeIn } from "@/shared/ui/scroll-fade-in";
import { Database, Wand2, Code, Layers } from "lucide-react";
import { PresignedUrlAnimation } from "./animations/presigned-url-animation";
import { ImageTransformAnimation } from "./animations/image-transform-animation";
import { RestApiAnimation } from "./animations/rest-api-animation";
import { ProjectManagementAnimation } from "./animations/project-management-animation";

interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className = "" }: FeaturesSectionProps) {
  const t = useTranslations("LandingFeatures");

  const features = [
    {
      Icon: Database,
      name: t("feature1Title"),
      description: t("feature1Description"),
      background: <PresignedUrlAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Wand2,
      name: t("feature2Title"),
      description: t("feature2Description"),
      background: <ImageTransformAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Code,
      name: t("feature3Title"),
      description: t("feature3Description"),
      background: <RestApiAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Layers,
      name: t("feature4Title"),
      description: t("feature4Description"),
      background: <ProjectManagementAnimation />,
      className: "md:col-span-1",
    },
  ];

  return (
    <section id="features" className={`py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t("title")}
          </h2>
        </ScrollFadeIn>

        <ScrollFadeIn delay={100}>
          <BentoGrid className="max-w-4xl mx-auto">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </ScrollFadeIn>
      </div>
    </section>
  );
}
