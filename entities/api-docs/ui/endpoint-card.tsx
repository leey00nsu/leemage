"use client";

import { useEffect, useMemo, useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { ApiEndpoint } from "../model/types";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppCodeBlock } from "@/shared/ui/app/app-code-block";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { getRateLimitConfigForPath } from "@/shared/config/rate-limit";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/shared/ui/app/app-table";

interface EndpointCardProps {
  endpoint: ApiEndpoint;
}

function getPermissionTone(permission: ApiEndpoint["requiredPermission"]): string {
  if (permission === "read") {
    return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-300";
  }

  if (permission === "write") {
    return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300";
  }

  if (permission === "delete") {
    return "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300";
  }

  return "bg-slate-100 text-slate-700 ring-slate-600/20 dark:bg-slate-800 dark:text-slate-300";
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const t = useTranslations("EndpointCard");
  const [activeResponseStatus, setActiveResponseStatus] = useState(
    endpoint.responses[0]?.status.toString() ?? "",
  );

  useEffect(() => {
    setActiveResponseStatus(endpoint.responses[0]?.status.toString() ?? "");
  }, [endpoint.responses]);

  const sortedResponses = useMemo(
    () => [...endpoint.responses].sort((a, b) => a.status - b.status),
    [endpoint.responses],
  );

  const activeResponse =
    sortedResponses.find(
      (response) => response.status.toString() === activeResponseStatus,
    ) ?? sortedResponses[0];

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(successMessage);
    } catch {
      toast.error(t("copyError"));
    }
  };

  const permissionLabel = endpoint.requiredPermission
    ? t(`permissions.${endpoint.requiredPermission}`)
    : t("permissions.unknown");
  const displayPath = endpoint.fullPath || endpoint.path;
  const rateLimit = getRateLimitConfigForPath(displayPath);
  const windowSeconds = Math.floor(rateLimit.windowMs / 1000);
  const blockSeconds = Math.floor(rateLimit.blockDurationMs / 1000);

  return (
    <article className="space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <AppMethodBadge method={endpoint.method} className="px-2.5 py-1 text-xs" />
          <code className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {displayPath}
          </code>
          <AppButton
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => copyToClipboard(displayPath, t("pathCopied"))}
            aria-label={t("copyPath")}
          >
            <Copy className="h-4 w-4" />
          </AppButton>
          {endpoint.auth ? (
            <span className="inline-flex items-center rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-slate-100 dark:text-slate-900">
              {t("authRequired")}
            </span>
          ) : null}
          {endpoint.auth ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${getPermissionTone(endpoint.requiredPermission)}`}
            >
              <span>{t("requiredPermission")}</span>
              <span>{permissionLabel}</span>
            </span>
          ) : null}
          {endpoint.deprecated ? (
            <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-300">
              {t("deprecated")}
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
            {t("rateLimit")}:{" "}
            {t("rateLimitValue", {
              requests: rateLimit.maxRequests,
              windowSeconds,
              blockSeconds,
            })}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {endpoint.description || t("noDescription")}
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
          {t("parameters")}
        </h3>
        {endpoint.parameters && endpoint.parameters.length > 0 ? (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            <AppTable className="min-w-[680px]">
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>{t("name")}</AppTableHead>
                  <AppTableHead>{t("location")}</AppTableHead>
                  <AppTableHead>{t("type")}</AppTableHead>
                  <AppTableHead>{t("required")}</AppTableHead>
                  <AppTableHead>{t("description")}</AppTableHead>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {endpoint.parameters.map((param) => (
                  <AppTableRow key={`${param.location ?? "unknown"}-${param.name}`}>
                    <AppTableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {param.name}
                    </AppTableCell>
                    <AppTableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {param.location ?? "-"}
                    </AppTableCell>
                    <AppTableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {param.type}
                    </AppTableCell>
                    <AppTableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {param.required ? t("yes") : t("no")}
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {param.description || "-"}
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTableBody>
            </AppTable>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("noParameters")}
          </p>
        )}
      </section>

      {endpoint.requestBody ? (
        <section className="space-y-3">
          <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            {t("requestBody")} ({endpoint.requestBody.type})
          </h3>
          <div className="rounded-lg border border-slate-200 dark:border-slate-800">
            <AppTable className="min-w-[680px]">
              <AppTableHeader>
                <AppTableRow>
                  <AppTableHead>{t("name")}</AppTableHead>
                  <AppTableHead>{t("type")}</AppTableHead>
                  <AppTableHead>{t("required")}</AppTableHead>
                  <AppTableHead>{t("description")}</AppTableHead>
                </AppTableRow>
              </AppTableHeader>
              <AppTableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                {endpoint.requestBody.properties.map((property) => (
                  <AppTableRow key={property.name}>
                    <AppTableCell className="font-mono text-xs text-slate-700 dark:text-slate-300">
                      {property.name}
                    </AppTableCell>
                    <AppTableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {property.type}
                    </AppTableCell>
                    <AppTableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {property.required ? t("yes") : t("no")}
                    </AppTableCell>
                    <AppTableCell className="text-sm text-slate-600 dark:text-slate-400">
                      {property.description || "-"}
                    </AppTableCell>
                  </AppTableRow>
                ))}
              </AppTableBody>
            </AppTable>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
          {t("response")}
        </h3>
        {sortedResponses.length > 0 ? (
          <Tabs value={activeResponseStatus} onValueChange={setActiveResponseStatus}>
            <TabsList className="h-auto flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
              {sortedResponses.map((response) => (
                <TabsTrigger
                  key={response.status}
                  value={response.status.toString()}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white"
                >
                  {response.status}
                </TabsTrigger>
              ))}
            </TabsList>
            {sortedResponses.map((response) => (
              <TabsContent
                key={response.status}
                value={response.status.toString()}
                className="space-y-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {response.description || "-"}
                  </p>
                  <AppButton
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(response.example, null, 2),
                        t("responseCopied"),
                      )
                    }
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t("copy")}
                  </AppButton>
                </div>
                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                  <AppCodeBlock className="bg-slate-50 text-xs text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    <code>{JSON.stringify(response.example, null, 2)}</code>
                  </AppCodeBlock>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t("noResponse")}
          </p>
        )}
        {activeResponse ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("activeResponse", { status: activeResponse.status })}
          </p>
        ) : null}
      </section>
    </article>
  );
}
