import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { ColumnDef } from "@tanstack/react-table";

import { AppCard } from "@/shared/ui/app/app-card";
import { CardContent } from "@/shared/ui/card";
import { AppDataTable } from "@/shared/ui/app/app-data-table";

import type { LogEntry } from "../model/types";
import { formatEndpoint } from "../lib/format-endpoint";
import { MethodBadge, StatusBadge } from "./api-log-badges";

interface ApiCallsTableProps {
  logs: LogEntry[];
  onRowClick: (log: LogEntry) => void;
}

export function ApiCallsTable({ logs, onRowClick }: ApiCallsTableProps) {
  const t = useTranslations("ApiLogs");

  const logColumns = useMemo<ColumnDef<LogEntry>[]>(
    () => [
      {
        id: "description",
        header: () => t("tableDescription"),
        cell: ({ row }) => {
          const log = row.original;
          const displayEndpoint = formatEndpoint(log.endpoint, log.method, log.metadata);
          return (
            <div className="flex items-center gap-2">
              <MethodBadge method={log.method} />
              <span className="text-sm">{displayEndpoint}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: () => t("tableTime"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {new Date(row.original.createdAt).toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: "durationMs",
        header: () => t("tableDuration"),
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.durationMs ? `${row.original.durationMs}ms` : "-"}
          </span>
        ),
      },
      {
        accessorKey: "statusCode",
        header: () => t("tableStatus"),
        cell: ({ row }) => <StatusBadge statusCode={row.original.statusCode} />,
      },
    ],
    [t],
  );

  return (
    <AppCard>
      <CardContent className="p-0">
        <AppDataTable
          columns={logColumns}
          data={logs}
          getRowId={(log) => log.id}
          onRowClick={onRowClick}
          emptyMessage={t("noData")}
          rowClassName="hover:bg-muted/50"
          labels={{
            rowsPerPage: t("rowsPerPage"),
            page: t("page"),
            previous: t("previous"),
            next: t("next"),
          }}
        />
      </CardContent>
    </AppCard>
  );
}
