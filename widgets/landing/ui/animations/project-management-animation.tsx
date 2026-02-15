"use client";

import { useMemo } from "react";

import { StorageProvider } from "@/lib/storage/types";
import { Marquee } from "@/shared/ui/marquee";

interface ShowcaseProject {
  name: string;
  description: string;
  storageProvider: StorageProvider;
  fileCount: number;
  updatedAt: string;
}

function formatUpdatedDate(iso: string) {
  return iso.slice(0, 10);
}

interface ProjectAnimationLabels {
  project1Name: string;
  project1Description: string;
  project2Name: string;
  project2Description: string;
  project3Name: string;
  project3Description: string;
  project4Name: string;
  project4Description: string;
  project5Name: string;
  project5Description: string;
}

interface ProjectManagementAnimationProps {
  labels: ProjectAnimationLabels;
}

export function ProjectManagementAnimation({
  labels,
}: ProjectManagementAnimationProps) {
  const projects = useMemo<ShowcaseProject[]>(
    () => [
      {
        name: labels.project1Name,
        description: labels.project1Description,
        storageProvider: StorageProvider.OCI,
        fileCount: 42,
        updatedAt: "2026-01-08T12:40:00.000Z",
      },
      {
        name: labels.project2Name,
        description: labels.project2Description,
        storageProvider: StorageProvider.R2,
        fileCount: 28,
        updatedAt: "2026-01-11T09:20:00.000Z",
      },
      {
        name: labels.project3Name,
        description: labels.project3Description,
        storageProvider: StorageProvider.OCI,
        fileCount: 15,
        updatedAt: "2026-01-10T04:15:00.000Z",
      },
      {
        name: labels.project4Name,
        description: labels.project4Description,
        storageProvider: StorageProvider.R2,
        fileCount: 33,
        updatedAt: "2026-01-09T19:05:00.000Z",
      },
      {
        name: labels.project5Name,
        description: labels.project5Description,
        storageProvider: StorageProvider.OCI,
        fileCount: 21,
        updatedAt: "2026-01-12T02:30:00.000Z",
      },
    ],
    [labels],
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      <Marquee pauseOnHover className="[--duration:28s]">
        {projects.map((project) => (
          <div
            key={`${project.storageProvider}-${project.name}`}
            className="w-80 min-w-80 shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {project.name}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {project.storageProvider}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>{project.fileCount} files</span>
              <span>{formatUpdatedDate(project.updatedAt)}</span>
            </div>
          </div>
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover className="mt-3 [--duration:28s]">
        {[...projects].reverse().map((project) => (
          <div
            key={`reverse-${project.storageProvider}-${project.name}`}
            className="w-80 min-w-80 shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {project.name}
                </p>
                <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {project.description}
                </p>
              </div>
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {project.storageProvider}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span>{project.fileCount} files</span>
              <span>{formatUpdatedDate(project.updatedAt)}</span>
            </div>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
