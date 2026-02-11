import { Button } from "@/shared/ui/button";
import { CreateProjectDialog } from "@/features/projects/create/ui/create-project-dialog";
import { PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

export function ProjectListHeader() {
  const t = useTranslations("ProjectListHeader");
  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <CreateProjectDialog>
        <Button size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> {t("createButton")}
        </Button>
      </CreateProjectDialog>
    </div>
  );
}
