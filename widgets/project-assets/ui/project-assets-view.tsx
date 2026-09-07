"use client";

import { TagFilter } from "@/features/tags/project-tags";
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, FileText, HardDrive, Search } from "lucide-react";

import { useGetProjectDetails } from "@/features/projects/details/model/get";
import { ProjectDetailSkeleton } from "@/widgets/project/ui/project-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { FileUploadDialog } from "@/features/files/upload/ui/file-upload-dialog";
import { EditProjectDialog } from "@/features/projects/edit/ui/edit-project-dialog";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { FileList } from "@/features/files/list/ui/file-list";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppSelect } from "@/shared/ui/app/app-select";
import { AppViewMode, AppViewToggle } from "@/shared/ui/app/app-view-toggle";
import {
  fileTypes,
  assetPageSizes,
  getAssetPageSize,
  sortOrders,
  getFormatLabel,
  type FileTypeFilter,
  type SortOrder,
} from "@/shared/lib/asset-filters";
import { useSearchParams } from "next/navigation";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { StorageProviderBadge } from "@/shared/ui/storage-provider-badge";
import { formatBytes } from "@/shared/lib/format-bytes";

export function ProjectAssetsView({ projectId }: { projectId: string }) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const params = useSearchParams();
  const {
    data: project,
    isLoading,
    isPlaceholderData,
    error,
  } = useGetProjectDetails(projectId, params.toString());
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(window.location.search);
    next.set(key, value);
    if (key !== "page" && key !== "view") next.set("page", "1");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${next}`,
    );
  };
  const t = useTranslations("ProjectAssets");
  const tProject = useTranslations("ProjectDetailsWidget");

  const searchTerm = params.get("search") || "";
  const typeFilter = fileTypes.includes(params.get("type") as FileTypeFilter)
    ? (params.get("type") as FileTypeFilter)
    : "ALL";
  const pageSize = getAssetPageSize(params.get("pageSize"));
  const formatFilter = params.get("format") || "ALL";
  const viewMode: AppViewMode = params.get("view") === "list" ? "list" : "grid";
  const sortOrder: SortOrder = sortOrders.includes(
    params.get("sort") as SortOrder,
  )
    ? (params.get("sort") as SortOrder)
    : "NEWEST";
  const setSearchTerm = (v: string) => update("search", v);
  const setTypeFilter = (v: string) => update("type", v);
  const setFormatFilter = (v: string) => update("format", v);
  const setViewMode = (v: string) => update("view", v);
  const setSortOrder = (v: string) => update("sort", v);

  const projectIdToCopy = project?.id ?? "";
  const { copied, handleCopy } = useCopyToClipboard({
    text: projectIdToCopy,
    onSuccessCallback: () => {
      toast.success(tProject("idCopied"));
    },
  });

  const filteredFiles = project?.files ?? [];
  const formatOptions = useMemo(
    () => [
      { value: "ALL", label: t("filters.formatAll") },
      ...(project?.formats ?? []).map((v) => ({
        value: v,
        label: getFormatLabel(v),
      })),
    ],
    [project?.formats, t],
  );

  if (isLoading) return <ProjectDetailSkeleton />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t("errorTitle")}</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : t("errorDescription")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert>
        <AlertTitle>{t("notFoundTitle")}</AlertTitle>
        <AlertDescription>{t("notFoundDescription")}</AlertDescription>
      </Alert>
    );
  }

  const totalBytes = project.totalBytes;
  const fileCount = project.fileCount;

  const noResults =
    (searchTerm.trim() !== "" ||
      typeFilter !== "ALL" ||
      formatFilter !== "ALL" ||
      !!params.get("tags")) &&
    filteredFiles.length === 0;

  return (
    <div
      ref={surfaceRef}
      className="mx-auto min-h-full max-w-[1600px] px-2 sm:px-4 py-2"
    >
      <div
        data-selection-ignore
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8"
      >
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {project.name}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {project.description?.trim() ? project.description : t("subtitle")}
          </p>
          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <div
              onClick={() => {
                if (!projectIdToCopy) return;
                handleCopy();
              }}
              className="inline-flex items-center gap-2 cursor-pointer"
              title={tProject("copyId")}
            >
              <span className="text-xs text-slate-500 dark:text-slate-400 break-all">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {tProject("idLabel")}
                </span>{" "}
                {project.id}
              </span>
              <AppButton
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 shadow-none"
                aria-label={tProject("copyId")}
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </AppButton>
            </div>

            {project.storageProvider && (
              <StorageProviderBadge provider={project.storageProvider} />
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end">
          <EditProjectDialog
            projectId={project.id}
            currentName={project.name}
            currentDescription={project.description}
          >
            <AppButton variant="outline" size="sm">
              {tProject("editButton")}
            </AppButton>
          </EditProjectDialog>
          <DeleteProjectButton
            projectId={project.id}
            projectName={project.name}
          />
          <FileUploadDialog projectId={projectId}>
            <AppButton size="sm">{tProject("uploadFileButton")}</AppButton>
          </FileUploadDialog>
        </div>
      </div>

      <div
        data-selection-ignore
        className="mb-6 flex items-center gap-4 text-sm text-muted-foreground border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-none hover:shadow-md hover:border-primary/50 transition-all duration-200 dark:hover:border-primary/50"
      >
        <div className="flex items-center gap-1.5">
          <HardDrive className="h-4 w-4" />
          <span>{tProject("storageUsage")}:</span>
          <span className="font-medium text-foreground">
            {formatBytes(totalBytes)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          <span>
            {fileCount} {tProject("files")}
          </span>
        </div>
      </div>

      <div
        data-selection-ignore
        className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-none hover:shadow-md hover:border-primary/50 transition-all duration-200 dark:hover:border-primary/50"
      >
        <div className="relative max-w-sm w-full md:w-auto flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <AppInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto">
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:border-r sm:border-gray-200 sm:dark:border-gray-700 sm:pr-3 sm:mr-1 [&>button]:w-full [&>button]:min-w-0 sm:[&>button]:w-auto sm:[&>button]:min-w-[9rem]">
            <AppSelect
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as FileTypeFilter)}
              options={[
                { value: "ALL", label: t("filters.typeAll") },
                { value: "IMAGE", label: t("filters.typeImage") },
                { value: "VIDEO", label: t("filters.typeVideo") },
                { value: "AUDIO", label: t("filters.typeAudio") },
                { value: "DOCUMENT", label: t("filters.typeDocument") },
                { value: "ARCHIVE", label: t("filters.typeArchive") },
                { value: "OTHER", label: t("filters.typeOther") },
              ]}
              aria-label={t("filters.typeLabel")}
            />

            <AppSelect
              value={formatFilter}
              onChange={setFormatFilter}
              options={formatOptions}
              aria-label={t("filters.formatLabel")}
            />

            <AppSelect
              value={sortOrder}
              onChange={(v) => setSortOrder(v as SortOrder)}
              options={[
                { value: "NEWEST", label: t("filters.sortNewest") },
                { value: "OLDEST", label: t("filters.sortOldest") },
                { value: "NAME_ASC", label: t("filters.sortNameAsc") },
                { value: "NAME_DESC", label: t("filters.sortNameDesc") },
                { value: "SIZE_DESC", label: t("filters.sortSizeDesc") },
              ]}
              aria-label={t("filters.sortLabel")}
            />
            <AppSelect
              value={String(pageSize)}
              onChange={(v) => update("pageSize", v)}
              options={assetPageSizes.map((size) => ({
                value: String(size),
                label: t("filters.pageSizeOption", { count: size }),
              }))}
              aria-label={t("filters.pageSizeLabel")}
            />
          </div>

          <AppViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <TagFilter projectId={projectId} selected={(params.get("tags") || "").split(",").filter(Boolean)} mode={params.get("tagMode") === "any" ? "any" : "all"} onChange={update} />

      {noResults ? (
        <p className="py-12 text-center text-muted-foreground">
          {t("noResults")}
        </p>
      ) : (
        <div
          aria-busy={isPlaceholderData}
          className={isPlaceholderData ? "pointer-events-none opacity-50" : ""}
        >
          <FileList
            key={`${projectId}:${params}`}
            surfaceRef={surfaceRef}
            files={filteredFiles}
            viewMode={viewMode}
            disabled={isPlaceholderData}
          />
        </div>
      )}
      <nav
        data-selection-ignore
        aria-label={t("pagination.label")}
        className="flex items-center justify-center gap-4 mt-6"
      >
        <AppButton
          variant="outline"
          disabled={isPlaceholderData || project.page <= 1}
          onClick={() => update("page", String(project.page - 1))}
        >
          {t("pagination.previous")}
        </AppButton>
        <span>
          {t("pagination.status", {
            page: project.page,
            pages: project.pageCount,
            total: project.total,
          })}
        </span>
        <AppButton
          variant="outline"
          disabled={isPlaceholderData || project.page >= project.pageCount}
          onClick={() => update("page", String(project.page + 1))}
        >
          {t("pagination.next")}
        </AppButton>
      </nav>
    </div>
  );
}
