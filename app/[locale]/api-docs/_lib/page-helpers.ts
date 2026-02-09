import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getApiDocsData } from "@/entities/api-docs/model/data";
import {
  ActiveItemKey,
  flattenApiDocs,
  getEndpointActiveKey,
  getHrefByActiveKey,
} from "@/entities/api-docs/model/navigation";

export type ApiDocsLocale = "ko" | "en";

const SEO_KEYWORDS: Record<ApiDocsLocale, string[]> = {
  ko: [
    "Leemage API 문서",
    "OpenAPI",
    "API Reference",
    "API Key 권한",
    "TypeScript SDK",
  ],
  en: [
    "Leemage API docs",
    "OpenAPI",
    "API reference",
    "API key permissions",
    "TypeScript SDK",
  ],
};

export function normalizeLocale(value: string): ApiDocsLocale {
  return value === "en" ? "en" : "ko";
}

async function loadApiDocs(locale: ApiDocsLocale) {
  const t = await getTranslations();
  const safeT = (key: string): string => {
    try {
      return t(key);
    } catch {
      return key;
    }
  };

  return getApiDocsData(locale, safeT);
}

function getStaticDocI18nKeys(activeItemKey: ActiveItemKey): {
  title: string;
  description: string;
} | null {
  switch (activeItemKey) {
    case "doc:introduction":
      return {
        title: "docs.introduction.title",
        description: "docs.introduction.summary",
      };
    case "doc:authentication":
      return {
        title: "docs.authentication.title",
        description: "docs.authentication.summary",
      };
    case "doc:rate-limits":
      return {
        title: "docs.rateLimits.title",
        description: "docs.rateLimits.summary",
      };
    case "doc:sdk":
      return {
        title: "docs.sdk.title",
        description: "docs.sdk.summary",
      };
    default:
      return null;
  }
}

async function getResolvedHeadlineAndDescription(
  locale: ApiDocsLocale,
  activeItemKey: ActiveItemKey,
  preloadedApiDocs?: Awaited<ReturnType<typeof loadApiDocs>>,
) {
  const tApiDocs = await getTranslations("ApiDocsView");
  const staticDocKeys = getStaticDocI18nKeys(activeItemKey);

  if (staticDocKeys) {
    return {
      headline: tApiDocs(staticDocKeys.title),
      description: tApiDocs(staticDocKeys.description),
    };
  }

  const apiDocs = preloadedApiDocs ?? (await loadApiDocs(locale));
  const endpoints = flattenApiDocs(apiDocs);
  const endpoint = endpoints.find((item) => item.key === activeItemKey);

  if (!endpoint) {
    return {
      headline: tApiDocs("title"),
      description: tApiDocs("description"),
    };
  }

  return {
    headline: `${endpoint.endpoint.method} ${endpoint.endpoint.path}`,
    description: endpoint.endpoint.description || tApiDocs("description"),
  };
}

export async function buildApiDocsMetadata({
  locale,
  activeItemKey,
}: {
  locale: string;
  activeItemKey: ActiveItemKey;
}): Promise<Metadata> {
  const normalizedLocale = normalizeLocale(locale);
  const { headline, description } = await getResolvedHeadlineAndDescription(
    normalizedLocale,
    activeItemKey,
  );
  const title = `${headline} | Leemage`;
  const canonicalPath = `/${normalizedLocale}${getHrefByActiveKey(activeItemKey)}`;

  return {
    title,
    description,
    keywords: SEO_KEYWORDS[normalizedLocale],
    alternates: {
      canonical: canonicalPath,
      languages: {
        ko: `/ko${getHrefByActiveKey(activeItemKey)}`,
        en: `/en${getHrefByActiveKey(activeItemKey)}`,
        "x-default": `/ko${getHrefByActiveKey(activeItemKey)}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalPath,
      locale: normalizedLocale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export async function getApiDocsRenderData({
  locale,
  activeItemKey,
}: {
  locale: string;
  activeItemKey: ActiveItemKey;
}) {
  const normalizedLocale = normalizeLocale(locale);
  const apiDocsData = await loadApiDocs(normalizedLocale);
  const { headline, description } = await getResolvedHeadlineAndDescription(
    normalizedLocale,
    activeItemKey,
    apiDocsData,
  );
  const canonicalPath = `/${normalizedLocale}${getHrefByActiveKey(activeItemKey)}`;

  return {
    activeItemKey,
    apiDocsData,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      headline,
      description,
      inLanguage: normalizedLocale,
      url: canonicalPath,
      mainEntityOfPage: canonicalPath,
      about: ["API", "OpenAPI", "SDK", "Authentication", "Rate Limits"],
      publisher: {
        "@type": "Organization",
        name: "Leemage",
      },
    },
  };
}

export async function hasEndpointForRoute({
  locale,
  method,
  path,
}: {
  locale: string;
  method: string;
  path: string;
}) {
  const normalizedLocale = normalizeLocale(locale);
  const apiDocsData = await loadApiDocs(normalizedLocale);
  const key = getEndpointActiveKey(method, path);
  return flattenApiDocs(apiDocsData).some((item) => item.key === key);
}
