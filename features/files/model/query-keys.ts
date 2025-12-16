export const fileKeys = {
  all: () => ["files"],
  list: (projectId: string) => ["files", "list", projectId],
  detail: (projectId: string, fileId: string) => ["files", "detail", projectId, fileId],
};

// 이전 키와의 호환성을 위한 별칭
export const imageKeys = fileKeys;
