import { prisma } from "@/lib/prisma";

/**
 * Ownership verification result
 */
export interface OwnershipResult {
  authorized: boolean;
  reason?: string;
}

/**
 * Authorization error codes
 */
export const OWNERSHIP_ERROR_CODES = {
  FORBIDDEN: "FORBIDDEN_RESOURCE",
  NOT_FOUND: "RESOURCE_NOT_FOUND",
} as const;

/**
 * Verifies that the user owns the specified project.
 * Returns NOT_FOUND for both non-existent and unauthorized resources
 * to prevent information disclosure (Requirement 3.5).
 * 
 * @param userId - The user identifier from session
 * @param projectId - The project ID to verify
 * @returns OwnershipResult indicating authorization status
 */
export async function verifyProjectOwnership(
  userId: string,
  projectId: string
): Promise<OwnershipResult> {
  if (!userId || !projectId) {
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });

    // Return same error for not found and unauthorized (Requirement 3.5)
    if (!project || project.userId !== userId) {
      return {
        authorized: false,
        reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
      };
    }

    return { authorized: true };
  } catch {
    // Don't expose internal errors
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }
}

/**
 * Verifies that the user owns the file through project ownership.
 * A user owns a file if they own the project containing the file.
 * 
 * @param userId - The user identifier from session
 * @param fileId - The file ID to verify
 * @returns OwnershipResult indicating authorization status
 */
export async function verifyFileOwnership(
  userId: string,
  fileId: string
): Promise<OwnershipResult> {
  if (!userId || !fileId) {
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }

  try {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: {
        project: {
          select: { userId: true },
        },
      },
    });

    // Return same error for not found and unauthorized (Requirement 3.5)
    if (!file || file.project.userId !== userId) {
      return {
        authorized: false,
        reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
      };
    }

    return { authorized: true };
  } catch {
    // Don't expose internal errors
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }
}

/**
 * Verifies file ownership using projectId (more efficient when projectId is known).
 * 
 * @param userId - The user identifier from session
 * @param fileId - The file ID to verify
 * @param projectId - The project ID the file should belong to
 * @returns OwnershipResult indicating authorization status
 */
export async function verifyFileOwnershipWithProject(
  userId: string,
  fileId: string,
  projectId: string
): Promise<OwnershipResult> {
  if (!userId || !fileId || !projectId) {
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }

  try {
    // First verify project ownership
    const projectResult = await verifyProjectOwnership(userId, projectId);
    if (!projectResult.authorized) {
      return projectResult;
    }

    // Then verify file belongs to the project
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      select: { projectId: true },
    });

    if (!file || file.projectId !== projectId) {
      return {
        authorized: false,
        reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
      };
    }

    return { authorized: true };
  } catch {
    return {
      authorized: false,
      reason: OWNERSHIP_ERROR_CODES.NOT_FOUND,
    };
  }
}
