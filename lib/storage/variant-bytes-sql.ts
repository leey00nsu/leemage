import { Prisma } from "@/lib/generated/prisma";

// Deduplicate actual object URLs and exclude the source reference in variants.
export const variantBytesSql = Prisma.sql`COALESCE((
  SELECT SUM(objects.bytes) FROM (
    SELECT v->>'url' AS object_url, MAX(COALESCE((v->>'size')::bigint, 0)) AS bytes
    FROM jsonb_array_elements("File".variants::jsonb) v
    WHERE v->>'url' IS NOT NULL
      AND ("File".url IS NULL OR v->>'url' <> "File".url)
      AND ("File"."objectName" IS NULL OR RIGHT(v->>'url', LENGTH("File"."objectName") + 1) <> '/' || "File"."objectName")
    GROUP BY v->>'url'
  ) objects
), 0)`;
