import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import {
  buildApiDocsMetadata,
  getApiDocsRenderData,
} from "../_lib/page-helpers";

interface SdkPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: SdkPageProps) {
  const { locale } = await params;
  return buildApiDocsMetadata({
    locale,
    activeItemKey: "doc:sdk",
  });
}

export default async function ApiDocsSdkPage({ params }: SdkPageProps) {
  const { locale } = await params;
  const { apiDocsData, activeItemKey, jsonLd } = await getApiDocsRenderData({
    locale,
    activeItemKey: "doc:sdk",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ApiDocsView apiDocs={apiDocsData} activeItemKey={activeItemKey} />
    </>
  );
}
