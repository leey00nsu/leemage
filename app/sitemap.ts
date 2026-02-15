import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { GETTING_STARTED_DOCS, getEndpointHref } from "@/entities/api-docs/model/navigation";
import { getApiReferenceRoutes } from "@/entities/api-docs/model/data";
import { toAbsoluteUrl } from "@/shared/config/site-url";

function withLocale(locale: string, pathname: string) {
  if (!pathname || pathname === "/") {
    return `/${locale}`;
  }
  return `/${locale}${pathname}`;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const paths = new Set<string>(["/"]);

  for (const locale of routing.locales) {
    paths.add(withLocale(locale, "/"));
    paths.add(withLocale(locale, "/api-docs"));
    paths.add(withLocale(locale, "/api-docs/sdk"));
    paths.add(withLocale(locale, "/auth/login"));

    for (const slug of Object.keys(GETTING_STARTED_DOCS)) {
      paths.add(withLocale(locale, `/api-docs/getting-started/${slug}`));
    }

    for (const route of getApiReferenceRoutes()) {
      paths.add(withLocale(locale, getEndpointHref(route.method, route.path)));
    }
  }

  return [...paths].map((pathname) => ({
    url: toAbsoluteUrl(pathname),
    lastModified,
  }));
}
