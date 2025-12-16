/**
 * Storage Error Handling
 * 
 * Provides standardized error handling for storage operations.
 */

export enum StorageErrorCode {
  PROVIDER_NOT_CONFIGURED = "PROVIDER_NOT_CONFIGURED",
  PRESIGN_FAILED = "PRESIGN_FAILED",
  OBJECT_NOT_FOUND = "OBJECT_NOT_FOUND",
  UPLOAD_FAILED = "UPLOAD_FAILED",
  DOWNLOAD_FAILED = "DOWNLOAD_FAILED",
  DELETE_FAILED = "DELETE_FAILED",
  INVALID_PROVIDER = "INVALID_PROVIDER",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export const STORAGE_ERROR_MESSAGES: Record<StorageErrorCode, string> = {
  [StorageErrorCode.PROVIDER_NOT_CONFIGURED]: "선택한 스토리지 프로바이더가 설정되지 않았습니다.",
  [StorageErrorCode.PRESIGN_FAILED]: "업로드 URL 생성에 실패했습니다.",
  [StorageErrorCode.OBJECT_NOT_FOUND]: "파일을 찾을 수 없습니다.",
  [StorageErrorCode.UPLOAD_FAILED]: "파일 업로드에 실패했습니다.",
  [StorageErrorCode.DOWNLOAD_FAILED]: "파일 다운로드에 실패했습니다.",
  [StorageErrorCode.DELETE_FAILED]: "파일 삭제에 실패했습니다.",
  [StorageErrorCode.INVALID_PROVIDER]: "지원하지 않는 스토리지 프로바이더입니다.",
  [StorageErrorCode.UNKNOWN_ERROR]: "스토리지 작업 중 오류가 발생했습니다.",
};

export class StorageError extends Error {
  constructor(
    public readonly code: StorageErrorCode,
    public readonly userMessage: string,
    public readonly originalError?: Error
  ) {
    super(userMessage);
    this.name = "StorageError";
  }

  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
    };
  }
}

/**
 * Translates provider-specific errors into user-friendly StorageError instances.
 * Ensures no internal details leak to users.
 */
export function translateStorageError(error: unknown, operation?: string): StorageError {
  // Log the original error for debugging
  console.error(`Storage operation failed${operation ? ` (${operation})` : ""}:`, error);

  // Determine error code based on error type/message
  let code = StorageErrorCode.UNKNOWN_ERROR;

  if (error instanceof StorageError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("not found") || message.includes("404") || message.includes("nosuchkey")) {
      code = StorageErrorCode.OBJECT_NOT_FOUND;
    } else if (message.includes("presign") || message.includes("par")) {
      code = StorageErrorCode.PRESIGN_FAILED;
    } else if (message.includes("upload") || message.includes("put")) {
      code = StorageErrorCode.UPLOAD_FAILED;
    } else if (message.includes("download") || message.includes("get")) {
      code = StorageErrorCode.DOWNLOAD_FAILED;
    } else if (message.includes("delete")) {
      code = StorageErrorCode.DELETE_FAILED;
    } else if (message.includes("not configured") || message.includes("credentials")) {
      code = StorageErrorCode.PROVIDER_NOT_CONFIGURED;
    }
  }

  return new StorageError(
    code,
    STORAGE_ERROR_MESSAGES[code],
    error instanceof Error ? error : undefined
  );
}

/**
 * Creates a StorageError for a specific error code.
 */
export function createStorageError(
  code: StorageErrorCode,
  originalError?: Error
): StorageError {
  return new StorageError(code, STORAGE_ERROR_MESSAGES[code], originalError);
}
