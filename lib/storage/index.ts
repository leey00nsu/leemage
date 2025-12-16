/**
 * Storage Module Index
 * 
 * Exports all storage-related types, interfaces, and utilities.
 */

export { StorageProvider, STORAGE_PROVIDER_LABELS, STORAGE_PROVIDER_DESCRIPTIONS, DEFAULT_STORAGE_PROVIDER } from "./types";
export type { StorageAdapter, CreatePresignedUrlOptions, PresignedUrlResult } from "./adapter";
export { StorageFactory } from "./factory";
export { StorageError, StorageErrorCode, STORAGE_ERROR_MESSAGES, translateStorageError, createStorageError } from "./errors";
export { fromPrismaStorageProvider, toPrismaStorageProvider, isValidStorageProvider } from "./utils";
export { OCIStorageAdapter } from "./adapters/oci";
export { CloudflareR2Adapter } from "./adapters/r2";
