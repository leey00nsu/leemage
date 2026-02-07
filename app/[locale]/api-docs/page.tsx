import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import { getApiDocsData } from "@/entities/api-docs/model/data";
import { getLocale, getTranslations } from "next-intl/server";

export default async function PublicApiDocsPage() {
  const locale = await getLocale();
  const t = await getTranslations();

  const safeT = (key: string): string => {
    try {
      return t(key);
    } catch {
      return key;
    }
  };

  const apiDocsData = await getApiDocsData(locale, safeT);

  return <ApiDocsView apiDocs={apiDocsData} />;
}
