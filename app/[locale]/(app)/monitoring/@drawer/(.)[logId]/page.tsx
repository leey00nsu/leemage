import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { MonitoringLogDrawer } from "@/features/monitoring/ui/monitoring-log-drawer";
import type { MonitoringLogDetail } from "@/features/monitoring/model/types";

interface MonitoringLogDrawerPageProps {
  params: Promise<{
    logId: string;
  }>;
}

export default async function MonitoringLogDrawerPage({
  params,
}: MonitoringLogDrawerPageProps) {
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

  return <MonitoringLogDrawer log={detail} />;
}

