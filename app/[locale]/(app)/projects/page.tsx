import { getTranslations } from "next-intl/server";
import { ProjectList } from "@/features/projects/list/ui/project-list";
import { Link } from "@/i18n/navigation";
import { Button } from "@/shared/ui/button";
import { PlusCircle } from "lucide-react";

export async function generateMetadata() {
  const t = await getTranslations("ProjectListHeader");
  return {
    title: t("title"),
  };
}

export default async function ProjectsPage() {
  const t = await getTranslations("ProjectListHeader");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-2">{t("description")}</p>
        </div>
        <Link href="/projects/new">
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> {t("createButton")}
          </Button>
        </Link>
      </div>
      <ProjectList />
    </div>
  );
}
