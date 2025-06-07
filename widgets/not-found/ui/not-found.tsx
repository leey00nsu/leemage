"use client";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/shared/ui/card";
import { Home } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";

export function NotFound() {
  const t = useTranslations("NotFound");
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  return (
    <Card className="w-full max-w-md text-center shadow-xl  bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <CardHeader className="pb-4">
        {/* 404 일러스트레이션 */}
        <div className="mx-auto mb-6 relative">
          <div className="text-8xl font-bold text-gray-200 dark:text-gray-700 select-none">
            404
          </div>
        </div>

        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t("title")}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
          {t("description")}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-3">
        {/* 홈으로 돌아가기 버튼 */}
        <Button asChild>
          <Link href={`/${locale}`}>
            <Home className="w-4 h-4 mr-2" />
            {t("homeButton")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
