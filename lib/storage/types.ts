/**
 * Storage Provider Types and Constants
 * 
 * Defines the supported storage providers and their metadata.
 */

export enum StorageProvider {
  OCI = "OCI",
  R2 = "R2",
}

export const STORAGE_PROVIDER_LABELS: Record<StorageProvider, string> = {
  [StorageProvider.OCI]: "OCI Object Storage",
  [StorageProvider.R2]: "Cloudflare R2",
};

export const STORAGE_PROVIDER_DESCRIPTIONS: Record<StorageProvider, string> = {
  [StorageProvider.OCI]: "Oracle Cloud Infrastructure Object Storage",
  [StorageProvider.R2]: "Cloudflare R2 - S3 호환 오브젝트 스토리지",
};

export const DEFAULT_STORAGE_PROVIDER = StorageProvider.OCI;
