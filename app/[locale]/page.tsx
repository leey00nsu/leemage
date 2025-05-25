import { HeroSection } from "@/widgets/landing/ui/hero-section";
import { FeaturesSection } from "@/widgets/landing/ui/features-section";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      {/* Hero Section */}
      <HeroSection />
      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}
