import { Button } from "@/shared/ui/button";
import { AppCard } from "@/shared/ui/app/app-card";
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Home } from "lucide-react";
import Link from "next/link";

interface NotFoundLabels {
  title: string;
  description: string;
  homeButton: string;
}

interface NotFoundProps {
  locale: string;
  labels: NotFoundLabels;
}

export function NotFound({ locale, labels }: NotFoundProps) {

  return (
    <AppCard className="w-full max-w-md text-center bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <CardHeader className="pb-4">
        {/* 404 일러스트레이션 */}
        <div className="mx-auto mb-6 relative">
          <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 select-none">
            404
          </div>
        </div>

        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {labels.title}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
          {labels.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {/* 홈으로 돌아가기 버튼 */}
        <Button asChild>
          <Link href={`/${locale}`}>
            <Home className="w-4 h-4 mr-2" />
            {labels.homeButton}
          </Link>
        </Button>
      </CardContent>
    </AppCard>
  );
}
