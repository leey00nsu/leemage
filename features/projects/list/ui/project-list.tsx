"use client";

import { useGetProjects } from "../model/get";
import { ProjectSkeleton } from "@/entities/projects/ui/project-skeleton";
import { ProjectError } from "@/entities/projects/ui/project-error";
import { EmptyProjectState } from "@/entities/projects/ui/empty-project-state";
import { ProjectCard } from "@/entities/projects/ui/project-card";
import { ProjectGrid } from "@/entities/projects/ui/project-grid";

export function ProjectList() {
  const { data: projects, isLoading, isError, error } = useGetProjects();

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

  return (
    <ProjectGrid>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          id={project.id}
          name={project.name}
          description={project.description}
        />
      ))}
    </ProjectGrid>
  );
}
