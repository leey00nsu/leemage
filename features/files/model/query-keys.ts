export const fileKeys = {
  all: () => ["files"],
  list: (projectId: string) => ["files", "list", projectId],
  detail: (projectId: string, fileId: string) => ["files", "detail", projectId, fileId],
};
