"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  FileCode2,
  Search,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Link } from "@/i18n/navigation";
import { ApiCategory, ApiEndpoint } from "@/entities/api-docs/model/types";
import { getEndpointSdkExample } from "@/entities/api-docs/model/endpoint-sdk-examples";
import { getSdkCodeExamples } from "@/entities/sdk/model/code-examples";
import { EndpointCard } from "@/entities/api-docs/ui/endpoint-card";
import { LanguageSelectorButton } from "@/features/language/ui/langauge-selector-button";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppCodeBlock } from "@/shared/ui/app/app-code-block";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { AppSelect } from "@/shared/ui/app/app-select";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/shared/ui/app/app-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { RATE_LIMIT_CONFIG } from "@/shared/config/rate-limit";
import { CodeBlock } from "@/shared/ui/code-block";

interface ApiDocsViewProps {
  apiDocs: ApiCategory[];
}

const SDK_SOURCE_URL = "https://github.com/leey00nsu/leemage/tree/main/packages/sdk";

interface FlattenedEndpoint {
  key: `endpoint:${string}`;
  categoryName: string;
  categoryDescription: string;
  endpoint: ApiEndpoint;
}

type StaticDocKey =
  | "doc:introduction"
  | "doc:authentication"
  | "doc:rate-limits"
  | "doc:sdk";
type ActiveItemKey = StaticDocKey | `endpoint:${string}` | "";
type StaticDocSection = "gettingStarted" | "sdk";
type SdkTabId = "install" | "init" | "upload" | "projects";

interface StaticDocItem {
  key: StaticDocKey;
  section: StaticDocSection;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
  requestExample?: string;
  responseExample?: string;
}

function getTypeExample(type: string): unknown {
  const enumMatch = type.match(/"([^"]+)"/);
  if (enumMatch?.[1]) {
    return enumMatch[1];
  }

  if (type.includes("[]")) {
    return [];
  }

  if (type.includes("number") || type.includes("integer")) {
    return 0;
  }

  if (type.includes("boolean")) {
    return false;
  }

  return "string";
}

function buildRequestBodyExample(endpoint: ApiEndpoint): Record<string, unknown> {
  if (!endpoint.requestBody) {
    return {};
  }

  return endpoint.requestBody.properties.reduce<Record<string, unknown>>(
    (acc, property) => {
      acc[property.name] = getTypeExample(property.type);
      return acc;
    },
    {},
  );
}

function buildCurlCommand(endpoint: ApiEndpoint): string {
  const samplePath = endpoint.path.replace(/\{([^}]+)\}/g, "sample-$1");
  const queryParams =
    endpoint.parameters?.filter((parameter) => parameter.location === "query") ??
    [];

  const queryString = queryParams
    .map((parameter) => `${parameter.name}=<${parameter.type}>`)
    .join("&");

  const fullPath = queryString ? `${samplePath}?${queryString}` : samplePath;

  const lines: string[] = [
    `curl -X ${endpoint.method} \\`,
    `  "https://api.leemage.com${fullPath}" \\`,
  ];

  if (endpoint.auth) {
    lines.push(`  -H "Authorization: Bearer <YOUR_API_KEY>" \\`);
  }

  if (endpoint.requestBody) {
    lines.push(`  -H "Content-Type: application/json" \\`);
    lines.push(`  -d '${JSON.stringify(buildRequestBodyExample(endpoint), null, 2)}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }

  return lines.join("\n");
}

export function ApiDocsView({ apiDocs }: ApiDocsViewProps) {
  const t = useTranslations("ApiDocsView");
  const sdkT = useTranslations("SdkQuickStart");
  const locale = useLocale() as "ko" | "en";
  const tRaw = (key: string): string => {
    const value = t.raw(key);
    return typeof value === "string" ? value : String(value);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeItemKey, setActiveItemKey] = useState<ActiveItemKey>("doc:introduction");
  const [exampleLanguage, setExampleLanguage] = useState("curl");
  const [activeResponseStatus, setActiveResponseStatus] = useState("");
  const [activeSdkTab, setActiveSdkTab] = useState<SdkTabId>("install");

  const sdkCodeExamples = useMemo(() => getSdkCodeExamples(locale), [locale]);
  const activeSdkExample =
    sdkCodeExamples.find((example) => example.id === activeSdkTab) ??
    sdkCodeExamples[0];

  const staticDocs = useMemo<StaticDocItem[]>(
    () => [
      {
        key: "doc:introduction",
        section: "gettingStarted",
        title: tRaw("docs.introduction.title"),
        summary: tRaw("docs.introduction.summary"),
        paragraphs: [
          tRaw("docs.introduction.paragraph1"),
          tRaw("docs.introduction.paragraph2"),
        ],
        bullets: [
          tRaw("docs.introduction.bullet1"),
          tRaw("docs.introduction.bullet2"),
          tRaw("docs.introduction.bullet3"),
        ],
      },
      {
        key: "doc:authentication",
        section: "gettingStarted",
        title: tRaw("docs.authentication.title"),
        summary: tRaw("docs.authentication.summary"),
        paragraphs: [
          tRaw("docs.authentication.paragraph1"),
          tRaw("docs.authentication.paragraph2"),
        ],
        bullets: [
          tRaw("docs.authentication.bullet1"),
          tRaw("docs.authentication.bullet2"),
          tRaw("docs.authentication.bullet3"),
        ],
        requestExample: tRaw("docs.authentication.requestExample"),
        responseExample: tRaw("docs.authentication.responseExample"),
      },
      {
        key: "doc:rate-limits",
        section: "gettingStarted",
        title: tRaw("docs.rateLimits.title"),
        summary: tRaw("docs.rateLimits.summary"),
        paragraphs: [
          tRaw("docs.rateLimits.paragraph1"),
          tRaw("docs.rateLimits.paragraph2"),
        ],
        bullets: [
          tRaw("docs.rateLimits.bullet1"),
          tRaw("docs.rateLimits.bullet2"),
          tRaw("docs.rateLimits.bullet3"),
        ],
        responseExample: tRaw("docs.rateLimits.responseExample"),
      },
      {
        key: "doc:sdk",
        section: "sdk",
        title: tRaw("docs.sdk.title"),
        summary: tRaw("docs.sdk.summary"),
        paragraphs: [tRaw("docs.sdk.paragraph1"), tRaw("docs.sdk.paragraph2")],
        bullets: [
          tRaw("docs.sdk.bullet1"),
          tRaw("docs.sdk.bullet2"),
          tRaw("docs.sdk.bullet3"),
        ],
      },
    ],
    [t, tRaw],
  );

  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return apiDocs;
    }

    return apiDocs
      .map((category) => {
        const isCategoryMatch = category.name.toLowerCase().includes(query);
        const matchedEndpoints = category.endpoints.filter((endpoint) => {
          return [endpoint.method, endpoint.path, endpoint.description]
            .join(" ")
            .toLowerCase()
            .includes(query);
        });

        if (isCategoryMatch) {
          return category;
        }

        return {
          ...category,
          endpoints: matchedEndpoints,
        };
      })
      .filter((category) => category.endpoints.length > 0);
  }, [apiDocs, searchQuery]);

  const flattenedEndpoints = useMemo<FlattenedEndpoint[]>(() => {
    return filteredCategories.flatMap((category, categoryIndex) =>
      category.endpoints.map((endpoint, endpointIndex) => ({
        key: `endpoint:${category.name}-${endpoint.method}-${endpoint.path}-${categoryIndex}-${endpointIndex}`,
        categoryName: category.name,
        categoryDescription: category.description,
        endpoint,
      })),
    );
  }, [filteredCategories]);

  useEffect(() => {
    if (!activeItemKey) {
      setActiveItemKey(staticDocs[0]?.key ?? flattenedEndpoints[0]?.key ?? "");
      return;
    }

    const hasStatic = staticDocs.some((doc) => doc.key === activeItemKey);
    const hasEndpoint = flattenedEndpoints.some(
      (endpoint) => endpoint.key === activeItemKey,
    );

    if (!hasStatic && !hasEndpoint) {
      setActiveItemKey(staticDocs[0]?.key ?? flattenedEndpoints[0]?.key ?? "");
    }
  }, [activeItemKey, flattenedEndpoints, staticDocs]);

  const selectedStaticDoc = useMemo(
    () => staticDocs.find((doc) => doc.key === activeItemKey) ?? null,
    [activeItemKey, staticDocs],
  );

  const selectedEndpoint = useMemo(
    () => flattenedEndpoints.find((item) => item.key === activeItemKey) ?? null,
    [activeItemKey, flattenedEndpoints],
  );

  const selectedEndpointIndex = selectedEndpoint
    ? flattenedEndpoints.findIndex((item) => item.key === selectedEndpoint.key)
    : -1;

  const previousEndpoint =
    selectedEndpointIndex > 0 ? flattenedEndpoints[selectedEndpointIndex - 1] : null;
  const nextEndpoint =
    selectedEndpointIndex >= 0 &&
    selectedEndpointIndex < flattenedEndpoints.length - 1
      ? flattenedEndpoints[selectedEndpointIndex + 1]
      : null;

  const sdkExampleForEndpoint = selectedEndpoint
    ? getEndpointSdkExample(
        selectedEndpoint.endpoint.method,
        selectedEndpoint.endpoint.path,
        locale,
      )
    : null;

  useEffect(() => {
    if (exampleLanguage === "sdk" && !sdkExampleForEndpoint) {
      setExampleLanguage("curl");
    }
  }, [exampleLanguage, sdkExampleForEndpoint]);

  useEffect(() => {
    if (!selectedEndpoint) {
      setActiveResponseStatus("");
      return;
    }

    const firstStatus = selectedEndpoint.endpoint.responses[0]?.status.toString() ?? "";
    setActiveResponseStatus(firstStatus);
  }, [selectedEndpoint]);

  const activeResponse = selectedEndpoint?.endpoint.responses.find(
    (response) => response.status.toString() === activeResponseStatus,
  );

  const endpointRequestExample = selectedEndpoint
    ? exampleLanguage === "sdk" && sdkExampleForEndpoint
      ? sdkExampleForEndpoint.code
      : buildCurlCommand(selectedEndpoint.endpoint)
    : "";

  const endpointResponseExample = JSON.stringify(activeResponse?.example ?? {}, null, 2);

  const staticRequestExample =
    selectedStaticDoc?.key === "doc:sdk"
      ? activeSdkExample?.code
      : selectedStaticDoc?.requestExample ?? "";

  const staticResponseExample =
    selectedStaticDoc?.key === "doc:sdk"
      ? tRaw("docs.sdk.responseExample")
      : selectedStaticDoc?.responseExample ?? "";

  const rateLimitRows = [
    {
      scope: tRaw("docs.rateLimits.rows.api.scope"),
      ...RATE_LIMIT_CONFIG.api,
    },
    {
      scope: tRaw("docs.rateLimits.rows.uploadConfirm.scope"),
      ...RATE_LIMIT_CONFIG.uploadConfirm,
    },
    {
      scope: tRaw("docs.rateLimits.rows.login.scope"),
      ...RATE_LIMIT_CONFIG.login,
    },
  ];

  const copyText = async (value: string, message: string) => {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      toast.success(message);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const mobileOptions = [
    ...staticDocs.map((doc) => ({
      value: doc.key,
      label: `${t(`sections.${doc.section}`)} · ${doc.title}`,
    })),
    ...flattenedEndpoints.map((item) => ({
      value: item.key,
      label: `${item.endpoint.method} ${item.endpoint.path}`,
    })),
  ];

  return (
    <div className="h-screen overflow-hidden bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex h-full max-w-[1800px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col dark:border-slate-800 dark:bg-slate-900/60">
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <Link href="/" className="mb-3 inline-flex items-center gap-2">
              <Image
                src="/logo.webp"
                alt="Leemage"
                width={24}
                height={24}
                className="object-contain"
              />
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Leemage
              </span>
            </Link>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              {t("sidebarBadge")}
            </p>
            <h2 className="mt-1 text-base font-bold">{t("sidebarTitle")}</h2>
          </div>

          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <AppInput
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <div className="space-y-2">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("sections.gettingStarted")}
              </h3>
              <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                {staticDocs
                  .filter((doc) => doc.section === "gettingStarted")
                  .map((doc) => (
                    <li key={doc.key}>
                      <button
                        type="button"
                        onClick={() => setActiveItemKey(doc.key)}
                        className={`w-full rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                          activeItemKey === doc.key
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        {doc.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("sections.sdk")}
              </h3>
              <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                {staticDocs
                  .filter((doc) => doc.section === "sdk")
                  .map((doc) => (
                    <li key={doc.key}>
                      <button
                        type="button"
                        onClick={() => setActiveItemKey(doc.key)}
                        className={`w-full rounded-md px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                          activeItemKey === doc.key
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                        }`}
                      >
                        {doc.title}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("sections.endpoints")}
              </h3>
              {filteredCategories.map((category) => (
                <div key={category.name} className="space-y-2">
                  <h4 className="px-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {category.name}
                  </h4>
                  <ul className="space-y-1 border-l border-slate-200 pl-2 dark:border-slate-800">
                    {flattenedEndpoints
                      .filter((item) => item.categoryName === category.name)
                      .map((item) => (
                        <li key={item.key}>
                          <button
                            type="button"
                            onClick={() => setActiveItemKey(item.key)}
                            className={`w-full rounded-md px-2.5 py-2 text-left transition-colors ${
                              activeItemKey === item.key
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AppMethodBadge method={item.endpoint.method} />
                              <span className="truncate text-xs font-medium">
                                {item.endpoint.path}
                              </span>
                            </div>
                            <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                              {item.endpoint.description}
                            </p>
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <LanguageSelectorButton className="w-full" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
              <header className="mb-6 space-y-4">
                <div>
                  <div className="mb-4 flex items-center justify-between lg:hidden">
                    <Link href="/" className="inline-flex items-center gap-2">
                      <Image
                        src="/logo.webp"
                        alt="Leemage"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
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
                    onChange={(value) => setActiveItemKey(value as ActiveItemKey)}
                    options={mobileOptions}
                    placeholder={t("endpointSelectPlaceholder")}
                    aria-label={t("endpointSelectAria")}
                    triggerClassName="w-full"
                  />
                </div>
              </header>

              {selectedStaticDoc ? (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("breadcrumbs.reference")}</span>
                      <span>/</span>
                      <span>{t(`sections.${selectedStaticDoc.section}`)}</span>
                      <span>/</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {selectedStaticDoc.title}
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                      {selectedStaticDoc.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {selectedStaticDoc.summary}
                    </p>
                  </section>

                  <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedStaticDoc.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {selectedStaticDoc.bullets && selectedStaticDoc.bullets.length > 0 ? (
                      <ul className="list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-400">
                        {selectedStaticDoc.bullets.map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>

                  {selectedStaticDoc.key === "doc:rate-limits" ? (
                    <section className="space-y-3">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {t("docs.rateLimits.tableTitle")}
                      </h3>
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800">
                        <AppTable className="min-w-[680px]">
                          <AppTableHeader>
                            <AppTableRow>
                              <AppTableHead>
                                {t("docs.rateLimits.columns.scope")}
                              </AppTableHead>
                              <AppTableHead>
                                {t("docs.rateLimits.columns.maxRequests")}
                              </AppTableHead>
                              <AppTableHead>
                                {t("docs.rateLimits.columns.window")}
                              </AppTableHead>
                              <AppTableHead>
                                {t("docs.rateLimits.columns.blockDuration")}
                              </AppTableHead>
                            </AppTableRow>
                          </AppTableHeader>
                          <AppTableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {rateLimitRows.map((row) => (
                              <AppTableRow key={row.scope}>
                                <AppTableCell className="text-slate-700 dark:text-slate-300">
                                  {row.scope}
                                </AppTableCell>
                                <AppTableCell className="font-medium text-slate-800 dark:text-slate-100">
                                  {row.maxRequests}
                                </AppTableCell>
                                <AppTableCell className="text-slate-600 dark:text-slate-400">
                                  {Math.floor(row.windowMs / 1000)}s
                                </AppTableCell>
                                <AppTableCell className="text-slate-600 dark:text-slate-400">
                                  {Math.floor(row.blockDurationMs / 1000)}s
                                </AppTableCell>
                              </AppTableRow>
                            ))}
                          </AppTableBody>
                        </AppTable>
                      </div>
                    </section>
                  ) : null}

                  {selectedStaticDoc.key === "doc:sdk" ? (
                    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                            {t("docs.sdk.quickStartTitle")}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {t("docs.sdk.sourceNote")}
                          </p>
                        </div>
                        <AppButton variant="outline" size="sm" asChild>
                          <a
                            href={SDK_SOURCE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("docs.sdk.sourceButton")}
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </AppButton>
                      </div>
                      <Tabs
                        value={activeSdkTab}
                        onValueChange={(value) => setActiveSdkTab(value as SdkTabId)}
                      >
                        <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-4 dark:bg-slate-800">
                          <TabsTrigger value="install">{sdkT("install")}</TabsTrigger>
                          <TabsTrigger value="init">{sdkT("init")}</TabsTrigger>
                          <TabsTrigger value="upload">{sdkT("upload")}</TabsTrigger>
                          <TabsTrigger value="projects">{sdkT("projects")}</TabsTrigger>
                        </TabsList>
                        {(["install", "init", "upload", "projects"] as SdkTabId[]).map(
                          (tabId) => {
                            const tabExample = sdkCodeExamples.find(
                              (example) => example.id === tabId,
                            );
                            return (
                              <TabsContent key={tabId} value={tabId}>
                                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                                  <CodeBlock
                                    language={tabExample?.language ?? "typescript"}
                                    filename={tabExample?.filename ?? "example.ts"}
                                    code={tabExample?.code ?? ""}
                                    highlightLines={tabExample?.highlightLines ?? []}
                                  />
                                </div>
                              </TabsContent>
                            );
                          },
                        )}
                      </Tabs>
                    </section>
                  ) : null}
                </div>
              ) : selectedEndpoint ? (
                <div className="space-y-8">
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{t("breadcrumbs.reference")}</span>
                      <span>/</span>
                      <span>{selectedEndpoint.categoryName}</span>
                      <span>/</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {selectedEndpoint.endpoint.path}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {selectedEndpoint.endpoint.description}
                    </h2>
                    {selectedEndpoint.categoryDescription ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {selectedEndpoint.categoryDescription}
                      </p>
                    ) : null}
                  </section>

                  <EndpointCard endpoint={selectedEndpoint.endpoint} />

                  <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        {t("endpointSdk.title")}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {t("endpointSdk.description")}
                      </p>
                    </div>
                    {sdkExampleForEndpoint ? (
                      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <CodeBlock
                          language={sdkExampleForEndpoint.language ?? "typescript"}
                          filename="sdk-example.ts"
                          code={sdkExampleForEndpoint.code}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {t("endpointSdk.empty")}
                      </p>
                    )}
                  </section>

                  <section className="grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        previousEndpoint && setActiveItemKey(previousEndpoint.key)
                      }
                      disabled={!previousEndpoint}
                      className="rounded-lg border border-slate-200 p-4 text-left transition-colors enabled:hover:border-primary enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:enabled:hover:bg-slate-900/50"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("previous")}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                        <ChevronLeft className="h-4 w-4" />
                        {previousEndpoint
                          ? `${previousEndpoint.endpoint.method} ${previousEndpoint.endpoint.path}`
                          : t("none")}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => nextEndpoint && setActiveItemKey(nextEndpoint.key)}
                      disabled={!nextEndpoint}
                      className="rounded-lg border border-slate-200 p-4 text-right transition-colors enabled:hover:border-primary enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:enabled:hover:bg-slate-900/50"
                    >
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("next")}
                      </p>
                      <p className="mt-2 flex items-center justify-end gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                        {nextEndpoint
                          ? `${nextEndpoint.endpoint.method} ${nextEndpoint.endpoint.path}`
                          : t("none")}
                        <ChevronRight className="h-4 w-4" />
                      </p>
                    </button>
                  </section>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("noData")}
                  </p>
                </div>
              )}
            </div>
          </main>

          <aside className="hidden w-[440px] shrink-0 border-l border-slate-200 bg-slate-900 text-slate-100 xl:flex xl:flex-col dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {selectedEndpoint ? t("exampleRequest") : t("referenceNotes")}
              </p>
              <div className="flex items-center gap-2">
                {selectedEndpoint ? (
                  <AppSelect
                    value={exampleLanguage}
                    onChange={setExampleLanguage}
                    options={[
                      { value: "curl", label: t("languages.curl") },
                      ...(sdkExampleForEndpoint
                        ? [{ value: "sdk", label: t("languages.sdk") }]
                        : []),
                    ]}
                    aria-label={t("languageSelectAria")}
                    triggerClassName="h-8 min-w-[7rem] border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                    contentClassName="border-slate-700 bg-slate-800 text-slate-200"
                  />
                ) : null}
                <AppButton
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-300 hover:text-white"
                  onClick={() =>
                    copyText(
                      selectedEndpoint ? endpointRequestExample : staticRequestExample,
                      t("requestCopied"),
                    )
                  }
                  aria-label={t("copyRequest")}
                  disabled={!selectedEndpoint && !staticRequestExample}
                >
                  <Copy className="h-4 w-4" />
                </AppButton>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AppCodeBlock className="min-h-[58%] bg-slate-900 text-slate-200">
                <code>
                  {selectedEndpoint
                    ? endpointRequestExample
                    : staticRequestExample || t("noCodeAvailable")}
                </code>
              </AppCodeBlock>
              <div className="flex items-center justify-between border-y border-slate-800 bg-slate-900 px-4 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t("exampleResponse")}
                </p>
                {selectedEndpoint ? (
                  <div className="flex items-center gap-2">
                    <AppSelect
                      value={activeResponseStatus}
                      onChange={setActiveResponseStatus}
                      options={selectedEndpoint.endpoint.responses.map((response) => ({
                        value: response.status.toString(),
                        label: response.status.toString(),
                      }))}
                      aria-label={t("responseStatusSelectAria")}
                      triggerClassName="h-8 min-w-[5rem] border-slate-700 bg-slate-800 text-xs text-slate-200 hover:bg-slate-700"
                      contentClassName="border-slate-700 bg-slate-800 text-slate-200"
                    />
                    <AppButton
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-300 hover:text-white"
                      onClick={() => copyText(endpointResponseExample, t("responseCopied"))}
                      aria-label={t("copyResponse")}
                    >
                      <Copy className="h-4 w-4" />
                    </AppButton>
                  </div>
                ) : null}
              </div>
              <AppCodeBlock className="min-h-[42%] bg-slate-900 text-slate-200">
                <code>
                  {selectedEndpoint
                    ? endpointResponseExample
                    : staticResponseExample || t("noCodeAvailable")}
                </code>
              </AppCodeBlock>
            </div>
          </aside>
        </div>
      </div>

      <button
        type="button"
        className="fixed bottom-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm xl:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        onClick={() =>
          copyText(
            selectedEndpoint ? endpointRequestExample : staticRequestExample,
            t("requestCopied"),
          )
        }
        aria-label={t("quickCopyAria")}
      >
        <FileCode2 className="h-4 w-4" />
      </button>
    </div>
  );
}
