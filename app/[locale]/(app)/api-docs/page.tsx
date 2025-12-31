import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import { getApiDocsData } from "@/entities/api-docs/model/data";
import { getLocale, getTranslations } from "next-intl/server";

export default async function ApiDocsPage() {
  const locale = await getLocale();
  const t = await getTranslations();

  // 번역 함수 래퍼 - 키가 없으면 키를 그대로 반환 (에러 방지)
  const safeT = (key: string): string => {
    try {
      return t(key);
    } catch {
      return key; // 번역 키가 없으면 키를 그대로 반환
    }
  };

  const apiDocsData = await getApiDocsData(locale, safeT);

  return <ApiDocsView apiDocs={apiDocsData} />;
}
