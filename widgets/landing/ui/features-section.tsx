"use client";

import { BentoCard, BentoGrid } from "@/shared/ui/bento-grid";
import { ScrollFadeIn } from "@/shared/ui/scroll-fade-in";
import { Database, Wand2, Code, Layers } from "lucide-react";
import { PresignedUrlAnimation } from "./animations/presigned-url-animation";
import { ImageTransformAnimation } from "./animations/image-transform-animation";
import { RestApiAnimation } from "./animations/rest-api-animation";
import { ProjectManagementAnimation } from "./animations/project-management-animation";

interface FeaturesSectionProps {
  className?: string;
  labels: {
    title: string;
    feature1Title: string;
    feature1Description: string;
    feature2Title: string;
    feature2Description: string;
    feature3Title: string;
    feature3Description: string;
    feature4Title: string;
    feature4Description: string;
    projectAnimation: {
      project1Name: string;
      project1Description: string;
      project2Name: string;
      project2Description: string;
      project3Name: string;
      project3Description: string;
      project4Name: string;
      project4Description: string;
      project5Name: string;
      project5Description: string;
    };
  };
}

export function FeaturesSection({ className = "", labels }: FeaturesSectionProps) {
  const features = [
    {
      Icon: Database,
      name: labels.feature1Title,
      description: labels.feature1Description,
      background: <PresignedUrlAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Wand2,
      name: labels.feature2Title,
      description: labels.feature2Description,
      background: <ImageTransformAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Code,
      name: labels.feature3Title,
      description: labels.feature3Description,
      background: <RestApiAnimation />,
      className: "md:col-span-1",
    },
    {
      Icon: Layers,
      name: labels.feature4Title,
      description: labels.feature4Description,
      background: <ProjectManagementAnimation labels={labels.projectAnimation} />,
      className: "md:col-span-1",
    },
  ];

  return (
    <section id="features" className={`py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <ScrollFadeIn>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {labels.title}
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
