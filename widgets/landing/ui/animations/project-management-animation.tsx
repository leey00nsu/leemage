"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { StorageProvider } from "@/lib/storage/types";
import { AppProjectCard } from "@/shared/ui/app/app-project-card";
import { Marquee } from "@/shared/ui/marquee";

interface ShowcaseProject {
  name: string;
  description: string;
  storageProvider: StorageProvider;
  fileCount: number;
  updatedAt: string;
}

export function ProjectManagementAnimation() {
  const t = useTranslations("LandingFeatures.projectAnimation");
  const projects = useMemo<ShowcaseProject[]>(
    () => [
      {
        name: t("project1Name"),
        description: t("project1Description"),
        storageProvider: StorageProvider.OCI,
        fileCount: 42,
        updatedAt: "2026-01-08T12:40:00.000Z",
      },
      {
        name: t("project2Name"),
        description: t("project2Description"),
        storageProvider: StorageProvider.R2,
        fileCount: 28,
        updatedAt: "2026-01-11T09:20:00.000Z",
      },
      {
        name: t("project3Name"),
        description: t("project3Description"),
        storageProvider: StorageProvider.OCI,
        fileCount: 15,
        updatedAt: "2026-01-10T04:15:00.000Z",
      },
      {
        name: t("project4Name"),
        description: t("project4Description"),
        storageProvider: StorageProvider.R2,
        fileCount: 33,
        updatedAt: "2026-01-09T19:05:00.000Z",
      },
      {
        name: t("project5Name"),
        description: t("project5Description"),
        storageProvider: StorageProvider.OCI,
        fileCount: 21,
        updatedAt: "2026-01-12T02:30:00.000Z",
      },
    ],
    [t],
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:28s]">
        {projects.map((project) => (
          <AppProjectCard
            key={`${project.storageProvider}-${project.name}`}
            className="w-80 min-w-80 shrink-0"
            layout="list"
            name={project.name}
            description={project.description}
            storageProvider={project.storageProvider}
            fileCount={project.fileCount}
            updatedAt={project.updatedAt}
          />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="mt-3 [--duration:28s]">
        {[...projects].reverse().map((project) => (
          <AppProjectCard
            key={`reverse-${project.storageProvider}-${project.name}`}
            className="w-80 min-w-80 shrink-0"
            layout="list"
            name={project.name}
            description={project.description}
            storageProvider={project.storageProvider}
            fileCount={project.fileCount}
            updatedAt={project.updatedAt}
          />
        ))}
      </Marquee>
    </div>
  );
}
