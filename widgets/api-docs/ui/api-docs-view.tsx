"use client";

import { useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { ApiCategory } from "@/entities/api-docs/model/types";
import type { ActiveItemKey } from "@/entities/api-docs/model/navigation";
import { getHrefByActiveKey } from "@/entities/api-docs/model/navigation";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppLogo } from "@/shared/ui/app/app-logo";
import { AppSelect } from "@/shared/ui/app/app-select";
import { buildStaticDocs } from "@/widgets/api-docs/model/static-docs";
import { useApiDocsSdkData } from "@/widgets/api-docs/model/use-api-docs-sdk-data";
import { useApiDocsSelection } from "@/widgets/api-docs/model/use-api-docs-selection";
import { useApiDocsState } from "@/widgets/api-docs/model/use-api-docs-state";
import { useMobileOptions } from "@/widgets/api-docs/model/use-mobile-options";
import { ApiDocsEndpointContent } from "@/widgets/api-docs/ui/api-docs-endpoint-content";
import { ApiDocsSidebar } from "@/widgets/api-docs/ui/api-docs-sidebar";
import { ApiDocsStaticContent } from "@/widgets/api-docs/ui/api-docs-static-content";

interface ApiDocsViewProps {
  apiDocs: ApiCategory[];
  activeItemKey: ActiveItemKey;
}

export function ApiDocsView({ apiDocs, activeItemKey }: ApiDocsViewProps) {
  const t = useTranslations("ApiDocsView");
  const locale = useLocale() as "ko" | "en";
  const router = useRouter();

  const tRaw = useCallback((key: string): string => {
    const value = t.raw(key);
    return typeof value === "string" ? value : String(value);
  }, [t]);

  const { searchQuery, setSearchQuery, activeSdkTab, setActiveSdkTab } =
    useApiDocsState();

  const staticDocs = useMemo(() => buildStaticDocs(tRaw), [tRaw]);

  const {
    filteredCategories,
    flattenedEndpoints,
    selectedStaticDoc,
    selectedEndpoint,
    previousEndpoint,
    nextEndpoint,
  } = useApiDocsSelection({
    apiDocs,
    activeItemKey,
    searchQuery,
    staticDocs,
  });

  const {
    sdkCodeExamples,
    sdkExampleForEndpoint,
    rateLimitRows,
  } = useApiDocsSdkData({
    locale,
    selectedEndpoint,
    tRaw,
  });

  const mobileOptions = useMobileOptions({
    activeItemKey,
    staticDocs,
    flattenedEndpoints,
    selectedEndpoint,
    selectedStaticDoc,
    getSectionLabel: (section) => t(`sections.${section}`),
    fallbackTitle: t("title"),
  });

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex h-full w-full">
        <ApiDocsSidebar
          activeItemKey={activeItemKey}
          staticDocs={staticDocs}
          filteredCategories={filteredCategories}
          flattenedEndpoints={flattenedEndpoints}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
            <header className="mb-6 space-y-4">
              <div>
                <div className="mb-4 flex items-center justify-between lg:hidden">
                  <Link href="/" className="inline-flex items-center gap-2">
                    <AppLogo size={24} />
                    <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                      Leemage
                    </span>
                  </Link>
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {t("title")}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {t("description")}
                </p>
              </div>

              <div className="space-y-3 lg:hidden">
                <LanguageSelectorButton className="w-full" />
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <AppInput
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="pl-9"
                  />
                </div>
                <AppSelect
                  value={activeItemKey}
                  onChange={(value) =>
                    router.push(getHrefByActiveKey(value as ActiveItemKey))
                  }
                  options={mobileOptions}
                  placeholder={t("endpointSelectPlaceholder")}
                  aria-label={t("endpointSelectAria")}
                  triggerClassName="w-full"
                />
              </div>
            </header>

            {selectedStaticDoc ? (
              <ApiDocsStaticContent
                selectedStaticDoc={selectedStaticDoc}
                activeSdkTab={activeSdkTab}
                onSdkTabChange={setActiveSdkTab}
                sdkCodeExamples={sdkCodeExamples}
                rateLimitRows={rateLimitRows}
              />
            ) : selectedEndpoint ? (
              <ApiDocsEndpointContent
                selectedEndpoint={selectedEndpoint}
                previousEndpoint={previousEndpoint}
                nextEndpoint={nextEndpoint}
                sdkExampleForEndpoint={sdkExampleForEndpoint}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("noData")}
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
