import { z } from "zod";

export const MAX_DELETE_FILES = 100;

export const deleteFilesSchema = z.object({
  fileIds: z
    .array(z.string().trim().min(1).max(128))
    .min(1)
    .max(MAX_DELETE_FILES)
    .transform((ids) => [...new Set(ids)]),
});
