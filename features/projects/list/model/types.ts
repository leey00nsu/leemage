export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  storageProvider: string;
  createdAt: string;
  updatedAt: string;
  fileCount: number;
}

