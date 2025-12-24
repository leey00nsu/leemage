export const storageUsageKeys = {
  all: ["storage-usage"] as const,
  usage: () => [...storageUsageKeys.all, "usage"] as const,
};
