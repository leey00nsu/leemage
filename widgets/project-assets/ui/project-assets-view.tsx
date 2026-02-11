"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy, FileText, HardDrive, Search } from "lucide-react";

import { useGetProjectDetails } from "@/features/projects/details/model/get";
import { ProjectDetailSkeleton } from "@/widgets/project/ui/project-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Link } from "@/i18n/navigation";
import { FileUploadDialog } from "@/features/files/upload/ui/file-upload-dialog";
import { EditProjectDialog } from "@/features/projects/edit/ui/edit-project-dialog";
import { DeleteProjectButton } from "@/features/projects/delete/ui/delete-project-button";
import { FileList } from "@/features/files/list/ui/file-list";
import { FileTypeIcon } from "@/entities/files/ui/file-type-icon";
import { AppButton } from "@/shared/ui/app/app-button";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppSelect } from "@/shared/ui/app/app-select";
import { AppViewMode, AppViewToggle } from "@/shared/ui/app/app-view-toggle";
import { isVideoMimeType } from "@/shared/lib/file-utils";
import { formatFileSize } from "@/shared/lib/file-utils";
import type { FileWithVariants } from "@/entities/files/model/types";
import { useCopyToClipboard } from "@/shared/model/copy-text";
import { toast } from "sonner";
import { StorageProviderBadge } from "@/shared/ui/storage-provider-badge";
import { formatBytes } from "@/shared/lib/format-bytes";

type FileTypeFilter = "ALL" | "IMAGE" | "VIDEO" | "OTHER";
type SortOrder = "NEWEST" | "OLDEST" | "NAME_ASC" | "NAME_DESC" | "SIZE_DESC";

function getFileType(file: FileWithVariants): Exclude<FileTypeFilter, "ALL"> {
  if (isVideoMimeType(file.mimeType)) return "VIDEO";
  if (file.mimeType.startsWith("image/")) return "IMAGE";
  return "OTHER";
}

function getFormatKey(mimeType: string): string {
  const part = mimeType.split("/")[1] ?? "file";
  return part.toLowerCase();
}

function getCreatedAtMs(file: FileWithVariants): number {
  const createdAt = (file as unknown as { createdAt?: string | Date }).createdAt;
  if (!createdAt) return 0;
  if (createdAt instanceof Date) return createdAt.getTime();
  const ms = Date.parse(createdAt);
  return Number.isNaN(ms) ? 0 : ms;
}

function sortFiles(files: FileWithVariants[], sortOrder: SortOrder) {
  const sorted = [...files];
  switch (sortOrder) {
    case "NEWEST":
      sorted.sort((a, b) => getCreatedAtMs(b) - getCreatedAtMs(a));
      return sorted;
    case "OLDEST":
      sorted.sort((a, b) => getCreatedAtMs(a) - getCreatedAtMs(b));
      return sorted;
    case "NAME_ASC":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
    case "NAME_DESC":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      return sorted;
    case "SIZE_DESC":
      sorted.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
      return sorted;
  }
}

function matchesSearch(file: FileWithVariants, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return file.name.toLowerCase().includes(q);
}

export function ProjectAssetsView({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useGetProjectDetails(projectId);
  const t = useTranslations("ProjectAssets");
  const tProject = useTranslations("ProjectDetailsWidget");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("ALL");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<AppViewMode>("grid");
  const [sortOrder, setSortOrder] = useState<SortOrder>("NEWEST");

  const projectIdToCopy = project?.id ?? "";
  const { copied, handleCopy } = useCopyToClipboard({
    text: projectIdToCopy,
    onSuccessCallback: () => {
      toast.success(tProject("idCopied"));
    },
  });

  const files = project?.files ?? [];

  const formatOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const file of files) {
      keys.add(getFormatKey(file.mimeType));
    }
    const values = Array.from(keys).sort();
    return [
      { value: "ALL", label: t("filters.formatAll") },
      ...values.map((v) => ({ value: v, label: v.toUpperCase() })),
    ];
  }, [files, t]);

  const filteredFiles = useMemo(() => {
    const bySearch = files.filter((f) => matchesSearch(f, searchTerm));
    const byType =
      typeFilter === "ALL"
        ? bySearch
        : bySearch.filter((f) => getFileType(f) === typeFilter);
    const byFormat =
      formatFilter === "ALL"
        ? byType
        : byType.filter((f) => getFormatKey(f.mimeType) === formatFilter);
    return sortFiles(byFormat, sortOrder);
  }, [files, searchTerm, typeFilter, formatFilter, sortOrder]);

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

  const totalBytes =
    project.files?.reduce((sum, file) => {
      let fileTotal = file.size || 0;
      if (Array.isArray(file.variants)) {
        fileTotal += file.variants.reduce((vSum, v) => vSum + (v.size || 0), 0);
      }
      return sum + fileTotal;
    }, 0) || 0;
  const fileCount = project.files?.length || 0;

  const noResults =
    (searchTerm.trim() !== "" || typeFilter !== "ALL" || formatFilter !== "ALL") &&
    filteredFiles.length === 0;

  return (
    <div className="mx-auto max-w-[1600px] px-2 sm:px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
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
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
          <FileUploadDialog projectId={projectId}>
            <AppButton size="sm">{tProject("uploadFileButton")}</AppButton>
          </FileUploadDialog>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-white dark:bg-gray-900 shadow-none hover:shadow-md hover:border-primary/50 transition-all duration-200 dark:hover:border-primary/50">
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-none hover:shadow-md hover:border-primary/50 transition-all duration-200 dark:hover:border-primary/50">
        <div className="relative max-w-sm w-full md:w-auto flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <AppInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-2 border-r border-gray-200 dark:border-gray-700 pr-3 mr-1">
            <AppSelect
              value={typeFilter}
              onChange={(v) => setTypeFilter(v as FileTypeFilter)}
              options={[
                { value: "ALL", label: t("filters.typeAll") },
                { value: "IMAGE", label: t("filters.typeImage") },
                { value: "VIDEO", label: t("filters.typeVideo") },
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
          </div>

          <AppViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {noResults ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noResults")}</p>
        </div>
      ) : viewMode === "grid" ? (
        <FileList files={filteredFiles} />
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
          <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-gray-100 dark:border-gray-800">
            <div className="col-span-7">{t("list.name")}</div>
            <div className="col-span-2">{t("list.type")}</div>
            <div className="col-span-3 text-right">{t("list.size")}</div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredFiles.map((file) => {
              const type = getFileType(file);
              const format = getFormatKey(file.mimeType).toUpperCase();
              return (
                <Link
                  key={file.id}
                  href={`/projects/${file.projectId}/files/${file.id}`}
                  className="grid grid-cols-12 gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="col-span-7 flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                      <FileTypeIcon mimeType={file.mimeType} size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {file.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {format}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center text-sm text-slate-600 dark:text-slate-300">
                    {t(`type.${type.toLowerCase()}`)}
                  </div>
                  <div className="col-span-3 flex items-center justify-end text-sm font-mono text-slate-600 dark:text-slate-300">
                    {formatFileSize(file.size ?? 0)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
