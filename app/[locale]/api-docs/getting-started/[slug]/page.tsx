import { notFound } from "next/navigation";
import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import { GETTING_STARTED_DOCS } from "@/entities/api-docs/model/navigation";
import {
  buildApiDocsMetadata,
  getApiDocsRenderData,
} from "../../_lib/page-helpers";

interface GettingStartedPageProps {
  params: Promise<{ locale: string; slug: string }>;
}

function resolveActiveItemKey(slug: string) {
  if (!(slug in GETTING_STARTED_DOCS)) {
    return null;
  }

  return GETTING_STARTED_DOCS[slug as keyof typeof GETTING_STARTED_DOCS];
}

export async function generateMetadata({ params }: GettingStartedPageProps) {
  const { locale, slug } = await params;
  const activeItemKey = resolveActiveItemKey(slug);
  if (!activeItemKey) {
    return {};
  }

  return buildApiDocsMetadata({
    locale,
    activeItemKey,
  });
}

export default async function GettingStartedDocPage({
  params,
}: GettingStartedPageProps) {
  const { locale, slug } = await params;
  const activeItemKey = resolveActiveItemKey(slug);
  if (!activeItemKey) {
    notFound();
  }

  const { apiDocsData, jsonLd } = await getApiDocsRenderData({
    locale,
    activeItemKey,
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
