import { z } from "zod";
export const MIB = 1024 * 1024;
export const DEFAULT_UPLOAD_BYTES = 50 * MIB;
export const HARD_MAX_UPLOAD_BYTES = 1024 * MIB;
export const projectUploadFields = {
  maxUploadBytes: z
    .number()
    .int()
    .min(MIB)
    .max(HARD_MAX_UPLOAD_BYTES)
    .optional(),
  videoThumbnailEnabled: z.boolean().optional(),
};
