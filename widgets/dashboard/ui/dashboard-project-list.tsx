"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { useGetProjects } from "@/features/projects/list/model/get";
import {
  filterProjects,
  type ProjectForFilter,
  type StorageProviderFilter,
} from "@/features/projects/list/model/filter";
import { AppCard } from "@/shared/ui/app/app-card";
import { AppInput } from "@/shared/ui/app/app-input";
import { AppProjectCard } from "@/shared/ui/app/app-project-card";
import { AppProjectCardSkeleton } from "@/shared/ui/app/app-project-card-skeleton";
import { AppSelect } from "@/shared/ui/app/app-select";
import { AppViewMode, AppViewToggle } from "@/shared/ui/app/app-view-toggle";
import { Skeleton } from "@/shared/ui/skeleton";

type ProjectSortOrder = "NEWEST" | "OLDEST" | "NAME_ASC" | "NAME_DESC";

interface ProjectForDashboard extends ProjectForFilter {
  createdAt?: string | Date;
}

function getCreatedAtMs(project: ProjectForDashboard): number {
  const createdAt = project.createdAt;
  if (!createdAt) return 0;
  if (createdAt instanceof Date) return createdAt.getTime();
  const ms = Date.parse(createdAt);
  return Number.isNaN(ms) ? 0 : ms;
}

function sortProjects<T extends ProjectForDashboard>(
  projects: T[],
  sortOrder: ProjectSortOrder
): T[] {
  const sorted = [...projects];

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
  }
}

export function DashboardProjectList() {
  const t = useTranslations("Dashboard");
  const tProjectCard = useTranslations("ProjectCard");
  const tProjectFilter = useTranslations("ProjectFilter");
  const tProjectSearch = useTranslations("ProjectSearch");
  const tProjectAssets = useTranslations("ProjectAssets");
  const tStorage = useTranslations("StorageProvider");
  const { data: projects, isLoading, isError, error } = useGetProjects();

  const [searchTerm, setSearchTerm] = useState("");
  const [storageFilter, setStorageFilter] = useState<StorageProviderFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<ProjectSortOrder>("NEWEST");
  const [viewMode, setViewMode] = useState<AppViewMode>("grid");

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    const filtered = filterProjects(projects, {
      searchTerm,
      storageProvider: storageFilter,
    });
    return sortProjects(filtered, sortOrder);
  }, [projects, searchTerm, storageFilter, sortOrder]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="min-w-[250px] max-w-sm flex-1">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <AppProjectCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <AppCard className="rounded-xl p-6">
        <p className="text-sm text-red-600 dark:text-red-400">
          {(error as Error)?.message || t("fetchError")}
        </p>
      </AppCard>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <AppCard className="rounded-xl p-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("noProjectsDescription")}
        </p>
      </AppCard>
    );
  }

  const hasActiveFilters = searchTerm.trim() !== "" || storageFilter !== "ALL";
  const noFilterResults = hasActiveFilters && filteredProjects.length === 0;

  return (
    <div className="space-y-4">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="relative min-w-[250px] max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <AppInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={tProjectSearch("placeholder")}
            className="pl-10"
            aria-label={tProjectSearch("placeholder")}
          />
        </div>

        <div className="flex items-center gap-3 overflow-x-auto">
          <div className="mr-1 flex items-center gap-2 border-r border-gray-200 pr-3 dark:border-gray-700">
            <AppSelect
              value={storageFilter}
              onChange={(value) => setStorageFilter(value as StorageProviderFilter)}
              options={[
                { value: "ALL", label: tProjectFilter("all") },
                { value: "OCI", label: tStorage("OCI") },
                { value: "R2", label: tStorage("R2") },
              ]}
              aria-label={tProjectFilter("placeholder")}
            />
            <AppSelect
              value={sortOrder}
              onChange={(value) => setSortOrder(value as ProjectSortOrder)}
              options={[
                { value: "NEWEST", label: tProjectAssets("filters.sortNewest") },
                { value: "OLDEST", label: tProjectAssets("filters.sortOldest") },
                { value: "NAME_ASC", label: tProjectAssets("filters.sortNameAsc") },
                { value: "NAME_DESC", label: tProjectAssets("filters.sortNameDesc") },
              ]}
              aria-label={tProjectAssets("filters.sortLabel")}
            />
          </div>
          <AppViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {noFilterResults ? (
        <AppCard className="rounded-xl p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {tProjectFilter("noResults")}
          </p>
        </AppCard>
      ) : (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block h-full">
                  <AppProjectCard
                    name={project.name}
                    description={project.description || tProjectCard("noDescription")}
                    storageProvider={project.storageProvider}
                    fileCount={project.fileCount}
                    updatedAt={project.updatedAt}
                    className="h-full"
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProjects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`} className="block">
                  <AppProjectCard
                    name={project.name}
                    description={project.description || tProjectCard("noDescription")}
                    storageProvider={project.storageProvider}
                    fileCount={project.fileCount}
                    updatedAt={project.updatedAt}
                    layout="list"
                  />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
