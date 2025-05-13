import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";
import { Cover } from "./cover";

export function HeroSection() {
  return (
    <section className="mb-16">
      <h1 className="relative z-20 mx-auto mt-6 max-w-7xl bg-gradient-to-b from-neutral-800 via-neutral-700 to-neutral-700 bg-clip-text py-6 text-center text-4xl font-semibold text-transparent dark:from-neutral-800 dark:via-white dark:to-white md:text-4xl lg:text-6xl">
        Upload Everything <br /> on <Cover>space</Cover>
      </h1>
      <Link href="/projects">
        <Button size="lg">
          지금 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </section>
  );
}
