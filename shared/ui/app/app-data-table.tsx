"use client";

import * as React from "react";
import {
  ColumnDef,
  PaginationState,
  Row,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/shared/ui/button";
import {
  AppTable,
  AppTableBody,
  AppTableCell,
  AppTableHead,
  AppTableHeader,
  AppTableRow,
} from "@/shared/ui/app/app-table";
import { cn } from "@/shared/lib/utils";

interface AppDataTableLabels {
  rowsPerPage: string;
  previous: string;
  next: string;
  page: string;
}

interface AppDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyMessage: string;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  onRowClick?: (row: TData) => void;
  rowClassName?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  labels?: Partial<AppDataTableLabels>;
  className?: string;
}

const DEFAULT_LABELS: AppDataTableLabels = {
  rowsPerPage: "Rows per page",
  previous: "Previous",
  next: "Next",
  page: "Page",
};

export function AppDataTable<TData>({
  columns,
  data,
  emptyMessage,
  getRowId,
  onRowClick,
  rowClassName,
  initialPageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  labels,
  className,
}: AppDataTableProps<TData>) {
  const mergedLabels = { ...DEFAULT_LABELS, ...labels };
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
  });

  React.useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [data.length]);

  return (
    <div className={cn("space-y-3", className)}>
      <AppTable>
        <AppTableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <AppTableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <AppTableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                </AppTableHead>
              ))}
            </AppTableRow>
          ))}
        </AppTableHeader>
        <AppTableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <AppTableRow
                key={row.id}
                className={cn(
                  onRowClick ? "cursor-pointer" : undefined,
                  rowClassName,
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <AppTableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </AppTableCell>
                ))}
              </AppTableRow>
            ))
          ) : (
            <AppTableRow>
              <AppTableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </AppTableCell>
            </AppTableRow>
          )}
        </AppTableBody>
      </AppTable>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="text-muted-foreground flex items-center gap-2 text-xs">
          <span>{mergedLabels.rowsPerPage}</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {mergedLabels.page} {table.getState().pagination.pageIndex + 1} /{" "}
            {Math.max(table.getPageCount(), 1)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {mergedLabels.previous}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {mergedLabels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
