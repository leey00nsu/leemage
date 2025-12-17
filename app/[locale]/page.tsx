import { LandingHeader } from "@/widgets/landing/ui/landing-header";
import { HeroSection } from "@/widgets/landing/ui/hero-section";
import { SolutionsSection } from "@/widgets/landing/ui/solutions-section";
import { FeaturesSection } from "@/widgets/landing/ui/features-section";
import { IntegrationsSection } from "@/widgets/landing/ui/integrations-section";
import { LandingFooter } from "@/widgets/landing/ui/landing-footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <LandingHeader />

      <main className="flex-grow">
        <HeroSection />
        <SolutionsSection />
        <FeaturesSection />
        <IntegrationsSection />
      </main>

      <LandingFooter />
    </div>
  );
}
