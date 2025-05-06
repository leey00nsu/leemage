import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="mb-16">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Leemage: 당신의 이미지를 위한 클라우드 솔루션
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Oracle Cloud Infrastructure 기반의 강력한 이미지 관리 및 제공 서비스를
        경험하세요. 프로젝트별로 이미지를 손쉽게 관리하고 필요한 형태로 변환하여
        사용하세요.
      </p>
      <Link href="/projects">
        <Button size="lg">
          지금 시작하기 <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </Link>
    </section>
  );
}
