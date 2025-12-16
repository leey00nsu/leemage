/**
 * Storage Utilities
 * 
 * Provides utility functions for storage provider operations.
 */

import { StorageProvider as PrismaStorageProvider } from "@/lib/generated/prisma";
import { StorageProvider, DEFAULT_STORAGE_PROVIDER } from "./types";

/**
 * Converts Prisma StorageProvider enum to application StorageProvider enum.
 * Handles backward compatibility for projects without storageProvider field.
 */
export function fromPrismaStorageProvider(
  prismaProvider: PrismaStorageProvider | null | undefined
): StorageProvider {
  if (!prismaProvider) {
    return DEFAULT_STORAGE_PROVIDER;
  }

  switch (prismaProvider) {
    case "OCI":
      return StorageProvider.OCI;
    case "R2":
      return StorageProvider.R2;
    default:
      return DEFAULT_STORAGE_PROVIDER;
  }
}

/**
 * Converts application StorageProvider enum to Prisma StorageProvider enum.
 */
export function toPrismaStorageProvider(
  provider: StorageProvider | null | undefined
): PrismaStorageProvider {
  if (!provider) {
    return "OCI";
  }

  switch (provider) {
    case StorageProvider.OCI:
      return "OCI";
    case StorageProvider.R2:
      return "R2";
    default:
      return "OCI";
  }
}

/**
 * Validates if a string is a valid StorageProvider value.
 */
export function isValidStorageProvider(value: string): value is StorageProvider {
  return Object.values(StorageProvider).includes(value as StorageProvider);
}
