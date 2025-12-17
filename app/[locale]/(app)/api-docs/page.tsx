import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
// import { apiDocsData } from "@/entities/api-docs/model/data"; // 기존 데이터 임포트 제거
import { getApiDocsData } from "@/entities/api-docs/model/data";
import { getLocale } from "next-intl/server";

export default async function ApiDocsPage() {
  const locale = await getLocale();
  const apiDocsData = await getApiDocsData(locale);

  return <ApiDocsView apiDocs={apiDocsData} />;
}
