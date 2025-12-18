import { Header } from "@/widgets/layout/ui/header";
import { Footer } from "@/widgets/layout/ui/footer";
import { HeroSection } from "@/widgets/landing/ui/hero-section";
import { SolutionsSection } from "@/widgets/landing/ui/solutions-section";
import { FeaturesSection } from "@/widgets/landing/ui/features-section";
import { IntegrationsSection } from "@/widgets/landing/ui/integrations-section";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Header />

      <main className="flex-grow">
        <HeroSection />
        <SolutionsSection />
        <FeaturesSection />
        <IntegrationsSection />
      </main>

      <Footer />
    </div>
  );
}
