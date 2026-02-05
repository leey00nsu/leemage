"use client";

import { ProjectAssetsView } from "@/widgets/project-assets/ui/project-assets-view";

interface ProjectDetailsWidgetProps {
  projectId: string;
}

export function ProjectDetailsWidget({ projectId }: ProjectDetailsWidgetProps) {
  return <ProjectAssetsView projectId={projectId} />;
}
