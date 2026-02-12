import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FlattenedEndpoint } from "@/entities/api-docs/model/navigation";
import { getHrefByActiveKey } from "@/entities/api-docs/model/navigation";
import { EndpointCard } from "@/entities/api-docs/ui/endpoint-card";
import { Link } from "@/i18n/navigation";
import { CodeBlock } from "@/shared/ui/code-block";
import { getEndpointDisplayPath } from "@/widgets/api-docs/model/endpoint-path";

interface ApiDocsEndpointContentProps {
  selectedEndpoint: FlattenedEndpoint;
  previousEndpoint: FlattenedEndpoint | null;
  nextEndpoint: FlattenedEndpoint | null;
  sdkExampleForEndpoint: { code: string; language: string } | null;
}

export function ApiDocsEndpointContent({
  selectedEndpoint,
  previousEndpoint,
  nextEndpoint,
  sdkExampleForEndpoint,
}: ApiDocsEndpointContentProps) {
  const t = useTranslations("ApiDocsView");

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>{t("breadcrumbs.reference")}</span>
          <span>/</span>
          <span>{selectedEndpoint.categoryName}</span>
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">
            {getEndpointDisplayPath(selectedEndpoint.endpoint)}
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
        {previousEndpoint ? (
          <Link
            href={getHrefByActiveKey(previousEndpoint.key)}
            className="rounded-lg border border-slate-200 p-4 text-left transition-colors hover:border-primary hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("previous")}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
              {`${previousEndpoint.endpoint.method} ${getEndpointDisplayPath(previousEndpoint.endpoint)}`}
            </p>
          </Link>
        ) : (
          <div className="rounded-lg border border-slate-200 p-4 text-left opacity-50 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("previous")}</p>
            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              <ChevronLeft className="h-4 w-4" />
              {t("none")}
            </p>
          </div>
        )}
        {nextEndpoint ? (
          <Link
            href={getHrefByActiveKey(nextEndpoint.key)}
            className="rounded-lg border border-slate-200 p-4 text-right transition-colors hover:border-primary hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/50"
          >
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("next")}</p>
            <p className="mt-2 flex items-center justify-end gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {`${nextEndpoint.endpoint.method} ${getEndpointDisplayPath(nextEndpoint.endpoint)}`}
              <ChevronRight className="h-4 w-4" />
            </p>
          </Link>
        ) : (
          <div className="rounded-lg border border-slate-200 p-4 text-right opacity-50 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("next")}</p>
            <p className="mt-2 flex items-center justify-end gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {t("none")}
              <ChevronRight className="h-4 w-4" />
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
