import "@/lib/openapi/setup";
import { z } from "zod";
import {
  tagNameSchema,
  fileTagsSchema,
  tagQuerySchema,
} from "@/shared/lib/project-tags";

export const projectTagSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
  })
  .openapi("ProjectTag");
export const tagNameRequestSchema = tagNameSchema.openapi("TagNameRequest");
export const fileTagsRequestSchema = fileTagsSchema.openapi("FileTagsRequest");
export const tagFilterQuerySchema = tagQuerySchema.openapi({
  description:
    "Filter files by comma-separated project tag IDs (up to 50). tagMode defaults to all; any matches at least one tag.",
});
