import { notFound } from "next/navigation";
import { ApiDocsView } from "@/widgets/api-docs/ui/api-docs-view";
import {
  decodeEndpointPathFromRouteSegments,
  getEndpointActiveKey,
} from "@/entities/api-docs/model/navigation";
import {
  buildApiDocsMetadata,
  getApiDocsRenderData,
  hasEndpointForRoute,
} from "../../../_lib/page-helpers";

const VALID_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

interface ApiReferencePageProps {
  params: Promise<{ locale: string; method: string; path: string[] }>;
}

function resolveEndpoint(params: { method: string; path: string[] }) {
  const method = params.method.toUpperCase();
  if (!VALID_METHODS.has(method)) {
    return null;
  }

  const path = decodeEndpointPathFromRouteSegments(params.path ?? []);
  return { method, path };
}

export async function generateMetadata({ params }: ApiReferencePageProps) {
  const { locale, method, path } = await params;
  const endpoint = resolveEndpoint({ method, path });
  if (!endpoint) {
    return {};
  }

  const exists = await hasEndpointForRoute({
    locale,
    method: endpoint.method,
    path: endpoint.path,
  });
  if (!exists) {
    return {};
  }

  return buildApiDocsMetadata({
    locale,
    activeItemKey: getEndpointActiveKey(endpoint.method, endpoint.path),
  });
}

export default async function ApiReferencePage({ params }: ApiReferencePageProps) {
  const { locale, method, path } = await params;
  const endpoint = resolveEndpoint({ method, path });
  if (!endpoint) {
    notFound();
  }

  const exists = await hasEndpointForRoute({
    locale,
    method: endpoint.method,
    path: endpoint.path,
  });
  if (!exists) {
    notFound();
  }

  const activeItemKey = getEndpointActiveKey(endpoint.method, endpoint.path);
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
