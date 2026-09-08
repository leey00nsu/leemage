import type { ProjectPreviewFile } from "@/shared/lib/project-preview";
export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  storageProvider: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
  recentFiles?: ProjectPreviewFile[];
  lastUploadedAt?: string | null;
}
