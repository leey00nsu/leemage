import { Header } from "@/widgets/layout/ui/header";
import { Footer } from "@/widgets/layout/ui/footer";
import { HeroSection } from "@/widgets/landing/ui/hero-section";
import { SolutionsSection } from "@/widgets/landing/ui/solutions-section";
import { FeaturesSection } from "@/widgets/landing/ui/features-section";
import { IntegrationsSection } from "@/widgets/landing/ui/integrations-section";
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tHeader = await getTranslations({ locale, namespace: "Header" });
  const tFooter = await getTranslations({ locale, namespace: "Footer" });
  const tHero = await getTranslations({ locale, namespace: "LandingHero" });
  const tSolutions = await getTranslations({
    locale,
    namespace: "SolutionsSection",
  });
  const tFeatures = await getTranslations({ locale, namespace: "LandingFeatures" });
  const tIntegrations = await getTranslations({
    locale,
    namespace: "IntegrationsSection",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      <Header
        labels={{
          projectsLink: tHeader("projectsLink"),
          apiDocsLink: tHeader("apiDocsLink"),
          apiSecurityLink: tHeader("apiSecurityLink"),
          logsLink: tHeader("logsLink"),
          accountLink: tHeader("accountLink"),
          menu: tHeader("menu"),
        }}
      />

      <main className="flex-grow">
        <HeroSection
          labels={{
            headline1: tHero("headline1"),
            headline2: tHero("headline2"),
            subtitle: tHero("subtitle"),
            primaryCta: tHero("primaryCta"),
            secondaryCta: tHero("secondaryCta"),
            floatingCard1: tHero("floatingCard1"),
            floatingCard2: tHero("floatingCard2"),
            floatingCard3: tHero("floatingCard3"),
            floatingCard4: tHero("floatingCard4"),
          }}
        />
        <SolutionsSection
          labels={{
            title: tSolutions("title"),
            subtitle: tSolutions("subtitle"),
            beforeLabel: tSolutions("beforeLabel"),
            afterLabel: tSolutions("afterLabel"),
            compare1Before: tSolutions("compare1Before"),
            compare1After: tSolutions("compare1After"),
            compare2Before: tSolutions("compare2Before"),
            compare2After: tSolutions("compare2After"),
            compare3Before: tSolutions("compare3Before"),
            compare3After: tSolutions("compare3After"),
            compare4Before: tSolutions("compare4Before"),
            compare4After: tSolutions("compare4After"),
            compare5Before: tSolutions("compare5Before"),
            compare5After: tSolutions("compare5After"),
          }}
        />
        <FeaturesSection
          labels={{
            title: tFeatures("title"),
            feature1Title: tFeatures("feature1Title"),
            feature1Description: tFeatures("feature1Description"),
            feature2Title: tFeatures("feature2Title"),
            feature2Description: tFeatures("feature2Description"),
            feature3Title: tFeatures("feature3Title"),
            feature3Description: tFeatures("feature3Description"),
            feature4Title: tFeatures("feature4Title"),
            feature4Description: tFeatures("feature4Description"),
            projectAnimation: {
              project1Name: tFeatures("projectAnimation.project1Name"),
              project1Description: tFeatures("projectAnimation.project1Description"),
              project2Name: tFeatures("projectAnimation.project2Name"),
              project2Description: tFeatures("projectAnimation.project2Description"),
              project3Name: tFeatures("projectAnimation.project3Name"),
              project3Description: tFeatures("projectAnimation.project3Description"),
              project4Name: tFeatures("projectAnimation.project4Name"),
              project4Description: tFeatures("projectAnimation.project4Description"),
              project5Name: tFeatures("projectAnimation.project5Name"),
              project5Description: tFeatures("projectAnimation.project5Description"),
            },
          }}
        />
        <IntegrationsSection title={tIntegrations("title")} />
      </main>

      <Footer copyright={tFooter("copyright")} />
    </div>
  );
}
