/**
 * Optimized storage quota utilities.
 * Uses database aggregation for efficient storage usage calculation.
 */

import { prisma } from "@/lib/prisma";
import { StorageProvider } from "@/lib/generated/prisma";

/**
 * Storage usage information
 */
export interface StorageUsage {
  totalBytes: number;
  fileCount: number;
  lastCalculated: Date;
}

/**
 * Storage usage cache entry
 */
interface CacheEntry {
  usage: StorageUsage;
  expiresAt: number;
}

/**
 * In-memory cache for storage usage
 */
const usageCache = new Map<StorageProvider, CacheEntry>();

/**
 * Default cache TTL: 5 minutes
 */
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Calculates storage usage using database aggregation.
 * This is more efficient than loading all records into memory.
 * 
 * @param provider - Storage provider to calculate usage for
 * @returns StorageUsage with total bytes and file count
 */
export async function calculateStorageUsage(
  provider: StorageProvider
): Promise<StorageUsage> {
  // Use Prisma aggregation for efficient calculation
  // This generates a single SQL query with SUM and COUNT
  const result = await prisma.file.aggregate({
    where: {
      project: { storageProvider: provider },
      status: "COMPLETED",
    },
    _sum: {
      size: true,
    },
    _count: {
      id: true,
    },
  });

  // Note: variants sizes are stored in JSON, so we need a separate query
  // For now, we calculate base file sizes only
  // A more complete solution would use a raw SQL query with JSON aggregation
  
  const totalBytes = result._sum.size || 0;
  const fileCount = result._count.id || 0;

  return {
    totalBytes,
    fileCount,
    lastCalculated: new Date(),
  };
}

/**
 * Gets storage usage with caching.
 * Returns cached value if available and not stale.
 * 
 * @param provider - Storage provider
 * @param maxAgeMs - Maximum cache age in milliseconds (default: 5 minutes)
 * @returns StorageUsage
 */
export async function getStorageUsage(
  provider: StorageProvider,
  maxAgeMs: number = DEFAULT_CACHE_TTL_MS
): Promise<StorageUsage> {
  const now = Date.now();
  const cached = usageCache.get(provider);

  // Return cached value if still valid
  if (cached && cached.expiresAt > now) {
    return cached.usage;
  }

  // Calculate fresh usage
  const usage = await calculateStorageUsage(provider);

  // Update cache
  usageCache.set(provider, {
    usage,
    expiresAt: now + maxAgeMs,
  });

  return usage;
}

/**
 * Invalidates storage usage cache for a provider.
 * Call this after file uploads or deletions.
 * 
 * @param provider - Storage provider to invalidate cache for
 */
export function invalidateStorageCache(provider: StorageProvider): void {
  usageCache.delete(provider);
}

/**
 * Invalidates all storage usage caches.
 */
export function invalidateAllStorageCaches(): void {
  usageCache.clear();
}

/**
 * Checks if storage quota would be exceeded by a new file.
 * Uses cached usage for performance.
 * 
 * @param provider - Storage provider
 * @param fileSize - Size of the new file in bytes
 * @returns Object with allowed status and remaining bytes
 */
export async function checkStorageQuotaOptimized(
  provider: StorageProvider,
  fileSize: number
): Promise<{
  allowed: boolean;
  message: string;
  remaining?: number;
  currentUsage?: number;
  quota?: number;
}> {
  // Get quota for this provider
  const quota = await prisma.storageQuota.findUnique({
    where: { provider },
  });

  // No quota set - allow upload
  if (!quota || Number(quota.quotaBytes) === 0) {
    return { allowed: true, message: "" };
  }

  // Get cached usage
  const usage = await getStorageUsage(provider);
  const quotaBytes = Number(quota.quotaBytes);
  const remaining = quotaBytes - usage.totalBytes;

  // Check if upload would exceed quota
  if (usage.totalBytes + fileSize > quotaBytes) {
    return {
      allowed: false,
      message: `Storage quota exceeded. Remaining: ${formatBytes(remaining)}`,
      remaining,
      currentUsage: usage.totalBytes,
      quota: quotaBytes,
    };
  }

  return {
    allowed: true,
    message: "",
    remaining,
    currentUsage: usage.totalBytes,
    quota: quotaBytes,
  };
}

/**
 * Formats bytes to human-readable string.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
