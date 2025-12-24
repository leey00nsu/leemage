/**
 * Storage quota utility functions
 */

export type UsageStatus = "normal" | "warning" | "critical" | "unknown";

export const USAGE_COLORS = {
  normal: "#22c55e", // green-500
  warning: "#eab308", // yellow-500
  critical: "#ef4444", // red-500
  unknown: "#6b7280", // gray-500
} as const;

export const WARNING_THRESHOLD = 70;
export const CRITICAL_THRESHOLD = 90;

/**
 * Get color based on usage percentage
 * @param percentage - Usage percentage (0-100), or undefined if no quota set
 * @returns Color hex code
 */
export function getUsageColor(percentage: number | undefined): string {
  if (percentage === undefined) {
    return USAGE_COLORS.unknown;
  }

  if (percentage >= CRITICAL_THRESHOLD) {
    return USAGE_COLORS.critical;
  }

  if (percentage >= WARNING_THRESHOLD) {
    return USAGE_COLORS.warning;
  }

  return USAGE_COLORS.normal;
}

/**
 * Get usage status based on percentage
 * @param percentage - Usage percentage (0-100), or undefined if no quota set
 * @returns Usage status
 */
export function getUsageStatus(percentage: number | undefined): UsageStatus {
  if (percentage === undefined) {
    return "unknown";
  }

  if (percentage >= CRITICAL_THRESHOLD) {
    return "critical";
  }

  if (percentage >= WARNING_THRESHOLD) {
    return "warning";
  }

  return "normal";
}

/**
 * Validate quota value
 * @param value - Quota value to validate
 * @returns true if valid (positive number), false otherwise
 */
export function validateQuota(value: number): boolean {
  return typeof value === "number" && !isNaN(value) && value > 0;
}

/**
 * Calculate remaining space
 * @param quota - Total quota in bytes
 * @param usage - Current usage in bytes
 * @returns Remaining space in bytes (minimum 0)
 */
export function calculateRemainingSpace(quota: number, usage: number): number {
  const remaining = quota - usage;
  return Math.max(0, remaining);
}

/**
 * Calculate usage percentage
 * @param usage - Current usage in bytes
 * @param quota - Total quota in bytes
 * @returns Percentage (0-100), or undefined if quota is 0 or not set
 */
export function calculateUsagePercentage(
  usage: number,
  quota: number | undefined
): number | undefined {
  if (!quota || quota <= 0) {
    return undefined;
  }

  const percentage = (usage / quota) * 100;
  return Math.min(100, Math.round(percentage * 10) / 10); // Round to 1 decimal, cap at 100
}

/**
 * Convert GB to bytes
 * @param gb - Value in gigabytes
 * @returns Value in bytes
 */
export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024;
}

/**
 * Convert bytes to GB
 * @param bytes - Value in bytes
 * @returns Value in gigabytes
 */
export function bytesToGb(bytes: number): number {
  return bytes / (1024 * 1024 * 1024);
}
