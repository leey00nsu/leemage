"use client";
import { VideoProcessingStatus } from "@/entities/files/ui/video/processing-status";

import { TagsDialog } from "@/features/tags/project-tags";
import { Badge } from "@/shared/ui/badge";
import { useRef, useState, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FileWithVariants } from "@/entities/files/model/types";
import { EmptyFileState } from "@/entities/files/ui/empty-file-state";
import { AssetCard } from "@/entities/files/ui/asset-card";
import { FileTypeIcon } from "@/entities/files/ui/file-type-icon";
import { useTranslations } from "next-intl";
import { AppCardLink } from "@/shared/ui/app/app-card-link";
import { AppButton } from "@/shared/ui/app/app-button";
import { formatFileSize } from "@/shared/lib/file-utils";
import { deleteFile } from "@/features/files/delete/api/delete";
import { projectKeys } from "@/features/projects/model/query-keys";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { useDragSelection } from "../model/use-drag-selection";
import { toast } from "sonner";

export function FileList({
  files,
  surfaceRef,
  viewMode = "grid",
  disabled = false,
}: {
  files: FileWithVariants[];
  surfaceRef: RefObject<HTMLDivElement | null>;
  viewMode?: "grid" | "list";
  disabled?: boolean;
}) {
  const t = useTranslations("FileList");
  const tDelete = useTranslations("DeleteFileDialog");
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setBusy] = useState(false);
  const busy = deleting || disabled;
  const anchor = useRef<number | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const rectangle = useDragSelection({
    surfaceRef,
    containerRef: container,
    selected,
    disabled: busy || dialogOpen,
    onSelect: setSelected,
  });
  const visibleSelected = files.filter((file) => selected.has(file.id));

  const select = (index: number, shift: boolean) => {
    const checked = !selected.has(files[index].id);
    const start =
      shift && anchor.current !== null
        ? Math.min(anchor.current, index)
        : index;
    const end =
      shift && anchor.current !== null
        ? Math.max(anchor.current, index)
        : index;
    setSelected((previous) => {
      const next = new Set(previous);
      for (let i = start; i <= end; i++) {
        if (checked) next.add(files[i].id);
        else next.delete(files[i].id);
      }
      return next;
    });
    anchor.current = index;
  };

  const removeSelected = async () => {
    const ids = visibleSelected.map((f) => f.id);
    if (!ids.length || busy) return;
    setBusy(true);
    const failed = new Set<string>();
    try {
      for (let i = 0; i < ids.length; i += 4) {
        const batch = ids.slice(i, i + 4);
        const results = await Promise.allSettled(
          batch.map((fileId) =>
            deleteFile({ projectId: files[0].projectId, fileId }),
          ),
        );
        results.forEach((result, j) => {
          if (result.status === "rejected") failed.add(batch[j]);
        });
      }
      setSelected(failed);
      if (failed.size) toast.error(t("deleteFailed", { count: failed.size }));
      else toast.success(t("deleteSuccess", { count: ids.length }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.all() }),
        queryClient.invalidateQueries({ queryKey: ["storage-usage"] }),
      ]);
    } finally {
      setBusy(false);
      setDialogOpen(false);
    }
  };

  if (!files.length) return <EmptyFileState message={t("noFilesInProject")} />;
  return (
    <div>
      <div
        data-selection-ignore
        className="mb-4 flex flex-wrap items-center gap-3"
      >
        <AppButton
          variant="outline"
          disabled={busy}
          onClick={() => {
            setSelected(
              visibleSelected.length > 0
                ? new Set()
                : new Set(files.map((f) => f.id)),
            );
            anchor.current = null;
          }}
        >
          {t(visibleSelected.length > 0 ? "clearSelection" : "selectAll")}
        </AppButton>
        <span className="order-3 w-full text-xs text-muted-foreground sm:order-none sm:w-auto">
          {t("selectionHint")}
        </span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {t("selected", { count: visibleSelected.length })}
          </span>
          <TagsDialog
            projectId={files[0].projectId}
            fileIds={visibleSelected.map((f) => f.id)}
            disabled={busy}
          />
          <AlertDialog
            open={dialogOpen}
            onOpenChange={(open) => {
              if (!deleting) setDialogOpen(open);
            }}
          >
            <AlertDialogTrigger asChild>
              <AppButton
                variant="destructive"
                disabled={busy || !visibleSelected.length}
              >
                {t("deleteSelected")}
              </AppButton>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tDelete("confirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("confirmDelete", { count: visibleSelected.length })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  {tDelete("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={busy}
                  onClick={(event) => {
                    event.preventDefault();
                    void removeSelected();
                  }}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  {deleting ? tDelete("deleting") : tDelete("confirmDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <div
        ref={container}
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 select-none"
            : "space-y-2 select-none"
        }
        onDragStart={(e) => e.preventDefault()}
      >
        {files.map((file, index) => (
          <div
            key={file.id}
            data-file-id={file.id}
            className={`relative ${viewMode === "grid" ? "rounded-lg" : "rounded-xl"}`}
          >
            {selected.has(file.id) && (
              <span
                aria-hidden="true"
                data-slot="card-selection-ring"
                className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] border-2 border-primary"
              />
            )}
            <Checkbox
              checked={selected.has(file.id)}
              disabled={busy}
              aria-label={t("selectFile", { name: file.name })}
              className="absolute left-2 top-2 z-10 bg-background cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                select(index, e.shiftKey);
              }}
            />
            {viewMode === "grid" ? (
              <AssetCard
                id={file.id}
                projectId={file.projectId}
                name={file.name}
                variants={file.variants}
                isImage={file.isImage}
                mimeType={file.mimeType}
                size={file.size}
                url={file.url}
              />
            ) : (
              <AppCardLink
                href={`/projects/${file.projectId}/files/${file.id}`}
                className="flex items-center gap-3 rounded-xl border py-4 pl-10 pr-4 hover:bg-muted"
              >
                <FileTypeIcon mimeType={file.mimeType} size={24} />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                <span className="hidden sm:block max-w-48 truncate text-xs text-muted-foreground">
                  {file.mimeType}
                </span>
                <span className="text-sm">{formatFileSize(file.size)}</span>
              </AppCardLink>
            )}
            <div className="px-2">
              <VideoProcessingStatus status={file.processingStatus} />
            </div>
            {!!file.tags?.length && (
              <div className="flex flex-wrap gap-1 px-2 py-2 pointer-events-none">
                {file.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="max-w-full"
                  >
                    <span className="truncate">{tag.name}</span>
                  </Badge>
                ))}
                {file.tags.length > 2 && (
                  <Badge variant="secondary">+{file.tags.length - 2}</Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      {rectangle && (
        <div
          className="fixed z-50 pointer-events-none border border-primary bg-primary/15"
          style={rectangle}
        />
      )}
    </div>
  );
}
