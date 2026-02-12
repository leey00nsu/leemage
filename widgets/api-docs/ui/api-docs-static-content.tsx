import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SdkCodeExample } from "@/entities/sdk/model/code-examples";
import { Link } from "@/i18n/navigation";
import { AppButton } from "@/shared/ui/app/app-button";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/shared/ui/app/app-table";
import { CodeBlock } from "@/shared/ui/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import type {
  ApiDocsRateLimitRow,
  SdkTabId,
  StaticDocItem,
} from "@/widgets/api-docs/model/types";

const SDK_SOURCE_URL = "https://www.npmjs.com/package/leemage-sdk";

interface ApiDocsStaticContentProps {
  selectedStaticDoc: StaticDocItem;
  activeSdkTab: SdkTabId;
  onSdkTabChange: (value: SdkTabId) => void;
  sdkCodeExamples: SdkCodeExample[];
  rateLimitRows: ApiDocsRateLimitRow[];
}

export function ApiDocsStaticContent({
  selectedStaticDoc,
  activeSdkTab,
  onSdkTabChange,
  sdkCodeExamples,
  rateLimitRows,
}: ApiDocsStaticContentProps) {
  const t = useTranslations("ApiDocsView");
  const sdkT = useTranslations("SdkQuickStart");

  return (
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

      {selectedStaticDoc.key === "doc:introduction" ? (
        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("specNotice.title")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t("specNotice.description")}
              </p>
            </div>
            <AppButton variant="outline" size="sm" asChild>
              <Link href="/api/v1/openapi" target="_blank" rel="noopener noreferrer">
                {t("specNotice.viewSpec")}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </AppButton>
          </div>
        </section>
      ) : null}

      {selectedStaticDoc.key === "doc:rate-limits" ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("docs.rateLimits.tableTitle")}
          </h3>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            <AppTable className="min-w-[680px]">
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>{t("docs.rateLimits.columns.scope")}</AppTableHead>
                  <AppTableHead>{t("docs.rateLimits.columns.maxRequests")}</AppTableHead>
                  <AppTableHead>{t("docs.rateLimits.columns.window")}</AppTableHead>
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
              <a href={SDK_SOURCE_URL} target="_blank" rel="noopener noreferrer">
                {t("docs.sdk.sourceButton")}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </AppButton>
          </div>
          <Tabs
            value={activeSdkTab}
            onValueChange={(value) => onSdkTabChange(value as SdkTabId)}
          >
            <TabsList className="grid h-auto grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 sm:grid-cols-4 dark:bg-slate-800">
              <TabsTrigger value="install">{sdkT("install")}</TabsTrigger>
              <TabsTrigger value="init">{sdkT("init")}</TabsTrigger>
              <TabsTrigger value="upload">{sdkT("upload")}</TabsTrigger>
              <TabsTrigger value="projects">{sdkT("projects")}</TabsTrigger>
            </TabsList>
            {(["install", "init", "upload", "projects"] as SdkTabId[]).map((tabId) => {
              const tabExample = sdkCodeExamples.find((example) => example.id === tabId);
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
            })}
          </Tabs>
        </section>
      ) : null}
    </div>
  );
}
