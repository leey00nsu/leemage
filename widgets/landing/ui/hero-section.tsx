import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import { Cover } from "@/shared/ui/cover";
import { useTranslations } from "next-intl";

export function HeroSection() {
  const t = useTranslations("HeroSection");
  return (
    <section className="mb-16">
      <h1 className="flex flex-col gap-2 items-center relative z-20 mx-auto mt-6 max-w-7xl bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 bg-clip-text py-6 text-center text-4xl font-semibold text-transparent dark:from-neutral-800 dark:via-white dark:to-white md:text-4xl lg:text-6xl">
        {t("mainHeading1")}
        <div className="flex items-center justify-center">
          <span className="hidden md:inline mr-2">{t("mainHeading2")}</span>{" "}
          <Cover>Leemage</Cover>
        </div>
      </h1>
      <Link href="/projects">
        <Button size="lg">
          {t("startButton")} <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </section>
  );
}
