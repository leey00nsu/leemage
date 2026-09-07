import { z } from "zod";

export type ProjectTag = { id: string; projectId: string; name: string };
export const tagNameSchema = z.object({
  name: z
    .string()
    .transform((value) => value.normalize("NFC").trim())
    .pipe(
      z
        .string()
        .min(1)
        .max(40)
        .regex(/^[^\u0000-\u001f\u007f]+$/),
    ),
});
export const fileTagsSchema = z.object({
  fileIds: z
    .array(z.string().min(1).max(128))
    .min(1)
    .max(100)
    .transform((ids) => [...new Set(ids)]),
  tagIds: z
    .array(z.string().min(1).max(128))
    .min(1)
    .max(50)
    .transform((ids) => [...new Set(ids)]),
  operation: z.enum(["add", "remove"]),
});
export const tagQuerySchema = z.object({
  tags: z.string().max(6500).optional(),
  tagMode: z.enum(["all", "any"]).optional(),
});
export function parseTagFilter(params: URLSearchParams) {
  const query = tagQuerySchema.parse({
    tags: params.get("tags") ?? undefined,
    tagMode: params.get("tagMode") ?? undefined,
  });
  const ids = [...new Set((query.tags || "").split(",").filter(Boolean))];
  z.array(z.string().min(1).max(128)).max(50).parse(ids);
  if (!ids.length) return {};
  return query.tagMode === "any"
    ? { tags: { some: { id: { in: ids } } } }
    : { AND: ids.map((id) => ({ tags: { some: { id } } })) };
}
