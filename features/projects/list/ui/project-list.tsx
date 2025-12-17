"use client";

import { useState, useMemo } from "react";
import { useGetProjects } from "../model/get";
import { ProjectSkeleton } from "@/entities/projects/ui/project-skeleton";
import { ProjectError } from "@/entities/projects/ui/project-error";
import { EmptyProjectState } from "@/entities/projects/ui/empty-project-state";
import { ProjectCard } from "@/entities/projects/ui/project-card";
import { ProjectGrid } from "@/entities/projects/ui/project-grid";
import { ProjectSearchInput } from "./project-search-input";
import { ProjectFilterSelect } from "./project-filter-select";
import { filterProjects, StorageProviderFilter } from "../model/filter";
import { useTranslations } from "next-intl";

export function ProjectList() {
  const { data: projects, isLoading, isError, error } = useGetProjects();
  const [searchTerm, setSearchTerm] = useState("");
  const [storageFilter, setStorageFilter] =
    useState<StorageProviderFilter>("ALL");
  const t = useTranslations("ProjectFilter");

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    return filterProjects(projects, {
      searchTerm,
      storageProvider: storageFilter,
    });
  }, [projects, searchTerm, storageFilter]);

  if (isLoading) {
    return <ProjectSkeleton count={3} />;
  }

  if (isError) {
    return (
      <ProjectError message={(error as Error)?.message || "알 수 없는 오류"} />
    );
  }

  if (!projects || projects.length === 0) {
    return <EmptyProjectState />;
  }

  const hasActiveFilters = searchTerm !== "" || storageFilter !== "ALL";
  const noFilterResults = hasActiveFilters && filteredProjects.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <ProjectSearchInput value={searchTerm} onChange={setSearchTerm} />
        </div>
        <ProjectFilterSelect value={storageFilter} onChange={setStorageFilter} />
      </div>

      {noFilterResults ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noResults")}</p>
        </div>
      ) : (
        <ProjectGrid>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              description={project.description}
              storageProvider={project.storageProvider}
            />
          ))}
        </ProjectGrid>
      )}
    </div>
  );
}
