import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { MonitoringLogDetail } from "@/features/monitoring/model/types";
import { AppCard } from "@/shared/ui/app/app-card";
import { AppMethodBadge } from "@/shared/ui/app/app-method-badge";
import { AppStatusPill } from "@/shared/ui/app/app-status-pill";

interface MonitoringLogPageProps {
  params: Promise<{
    logId: string;
  }>;
}

export default async function MonitoringLogPage({
  params,
}: MonitoringLogPageProps) {
  const t = await getTranslations("Monitoring");
  const { logId } = await params;

  const log = await prisma.apiLog.findUnique({
    where: { id: logId },
    select: {
      id: true,
      endpoint: true,
      method: true,
      statusCode: true,
      durationMs: true,
      createdAt: true,
      metadata: true,
      projectId: true,
    },
  });

  if (!log) {
    notFound();
  }

  const detail: MonitoringLogDetail = {
    id: log.id,
    endpoint: log.endpoint,
    method: log.method,
    statusCode: log.statusCode,
    durationMs: log.durationMs,
    createdAt: log.createdAt.toISOString(),
    metadata: log.metadata as Record<string, unknown> | null,
    projectId: log.projectId,
  };

  return <MonitoringLogDetailPage log={detail} title={t("drawer.title")} />;
}

function MonitoringLogDetailPage({
  log,
  title,
}: {
  log: MonitoringLogDetail;
  title: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[980px] px-2 py-4 sm:px-4">
      <div className="mb-4">
        <Link
          href="/monitoring"
          className="text-sm text-slate-500 underline-offset-4 hover:underline dark:text-slate-400"
        >
          ← Back to Monitoring
        </Link>
      </div>

      <AppCard className="rounded-xl border p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
            {title}
          </h1>
          <div className="flex items-center gap-2">
            <AppMethodBadge method={log.method} />
            <AppStatusPill statusCode={log.statusCode} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-slate-500">Timestamp</p>
            <p className="font-mono">{new Date(log.createdAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Latency</p>
            <p className="font-mono">
              {typeof log.durationMs === "number" ? `${log.durationMs}ms` : "-"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-slate-500">Endpoint</p>
            <p className="break-all font-mono">{log.endpoint}</p>
          </div>
          {log.projectId ? (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-slate-500">Project ID</p>
              <p className="break-all font-mono">{log.projectId}</p>
            </div>
          ) : null}
        </div>

        {log.metadata ? (
          <div className="mt-6">
            <p className="mb-2 text-xs text-slate-500">Metadata</p>
            <pre className="overflow-x-auto rounded-md bg-slate-100 p-3 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        ) : null}
      </AppCard>
    </div>
  );
}
