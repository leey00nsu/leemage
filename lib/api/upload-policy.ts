import { NextResponse } from "next/server";
import {
  DEFAULT_UPLOAD_BYTES,
  HARD_MAX_UPLOAD_BYTES,
  MIB,
} from "@/shared/lib/upload-policy";
export function serverUploadLimit() {
  const mb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB || 500);
  return Number.isInteger(mb) && mb >= 1 && mb * MIB <= HARD_MAX_UPLOAD_BYTES
    ? mb * MIB
    : 500 * MIB;
}
export const effectiveUploadLimit = (projectLimit?: number) =>
  Math.min(projectLimit ?? DEFAULT_UPLOAD_BYTES, serverUploadLimit());
export function uploadLimitError(fileSize: number, projectLimit?: number) {
  const limitBytes = effectiveUploadLimit(projectLimit);
  return fileSize > limitBytes
    ? NextResponse.json(
        {
          code: "FILE_SIZE_EXCEEDED",
          message: `File size exceeds the limit (${limitBytes / MIB} MiB).`,
          limitBytes,
        },
        { status: 413 },
      )
    : null;
}
