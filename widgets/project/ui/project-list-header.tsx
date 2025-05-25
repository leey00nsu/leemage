import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export function ProjectListHeader() {
  const t = useTranslations("ProjectListHeader");
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      {/* TODO: 새 프로젝트 생성 페이지 또는 모달 연결 */}
      <Link href="/projects/new">
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> {t("createButton")}
        </Button>
      </Link>
    </div>
  );
}
